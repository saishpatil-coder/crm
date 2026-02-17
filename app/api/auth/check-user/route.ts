import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const {phone: mobileNumber} = await req.json();

  if (!mobileNumber) {
    return NextResponse.json(
      { error: "Mobile required" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { mobileNumber },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found",exists:false,hasPassword:false }, { status: 404 });
  }
  if(user.passwordHash){
    return NextResponse.json({ error: "Password already set",exists:true,hasPassword:true }, { status: 200 });
  }

  return NextResponse.json({ message: "User exists and password not set",exists:true,hasPassword:false });
}
