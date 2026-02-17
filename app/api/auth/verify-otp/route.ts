import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { mobileNumber, otp } = await req.json();

    if (!mobileNumber || !otp) {
      return NextResponse.json(
        { error: "Mobile number and OTP required" },
        { status: 400 },
      );
    }

    const cleanedMobile = mobileNumber.trim();

    // 🔎 Find latest valid OTP
    const record = await prisma.otp.findFirst({
      where: {
        mobileNumber: cleanedMobile,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 },
      );
    }

    // 🔐 Compare OTP
    const valid = await bcrypt.compare(otp, record.codeHash);

    if (!valid) {
      return NextResponse.json({ error: "Wrong OTP" }, { status: 400 });
    }

    // ✅ Mark OTP verified
    await prisma.otp.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // 🧹 Delete all other OTPs for that number
    await prisma.otp.deleteMany({
      where: {
        mobileNumber: cleanedMobile,
        id: { not: record.id },
      },
    });

    // 👤 Fetch user
    const user = await prisma.user.findUnique({
      where: { mobileNumber: cleanedMobile },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.status) {
      return NextResponse.json({ error: "User is inactive" }, { status: 403 });
    }

    // 🎫 Generate JWT
    const token = await generateToken({
      userId: user.id,
      role: user.role.name,
      tenantId: user.tenantId,
    });

    return NextResponse.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
