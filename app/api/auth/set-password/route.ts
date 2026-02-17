import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { mobileNumber, password } = await req.json();

  if (!mobileNumber || !password) {
    return NextResponse.json(
      { error: "Mobile and password required" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { mobileNumber },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if(user.passwordHash){
    return NextResponse.json({ error: "Password already set" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ message: "Password set successfully" });
}
