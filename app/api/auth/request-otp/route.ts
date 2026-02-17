import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { mobileNumber } = await req.json();

    if (!mobileNumber) {
      return NextResponse.json({ error: "Mobile required" }, { status: 400 });
    }

    // ✅ Basic Mobile Validation (Indian numbers)
    const cleanedMobile = mobileNumber.trim();
    if (!/^[6-9]\d{9}$/.test(cleanedMobile)) {
      return NextResponse.json(
        { error: "Invalid mobile number" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { mobileNumber: cleanedMobile },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🛑 Rate Limit (1 OTP per 60 seconds)
    const recentOtp = await prisma.otp.findFirst({
      where: {
        mobileNumber: cleanedMobile,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentOtp) {
      return NextResponse.json(
        { error: "Wait 60 seconds before requesting new OTP" },
        { status: 429 },
      );
    }

    // 🔢 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(otp, 10);

    // 🗑 Delete old OTPs
    await prisma.otp.deleteMany({
      where: { mobileNumber: cleanedMobile },
    });

    // 💾 Save OTP
    await prisma.otp.create({
      data: {
        mobileNumber: cleanedMobile,
        codeHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // 📲 Send SMS via Fast2SMS
    const smsResponse = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q", // transactional route (better)
        message: `Your Campaign CRM OTP is ${otp}. Valid for 5 minutes.`,
        language: "english",
        numbers: cleanedMobile,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY!,
          "Content-Type": "application/json",
        },
      },
    );

    // 🔍 Check Fast2SMS response
    if (!smsResponse.data.return) {
      console.error("Fast2SMS Error:", smsResponse.data);
      return NextResponse.json(
        { error: "SMS sending failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "OTP sent successfully",
    });
  } catch (error: any) {
  console.error("OTP Error Status:", error.response?.status);
  console.error("OTP Error Data:", error.response?.data);
  return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
}

}
