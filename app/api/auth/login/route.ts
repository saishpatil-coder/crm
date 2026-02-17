import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateToken } from "@/lib/auth";

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
    include: { role: true },
  });

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await generateToken({
    userId: user.id,
    role: user.role.name,
    tenantId: user.tenantId,
  });
  const safeUser = {
    ...user,passwordHash:""
  }
  const response = NextResponse.json({ message: "Login successful" ,token,user:safeUser});
  
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  
  return response;
}
