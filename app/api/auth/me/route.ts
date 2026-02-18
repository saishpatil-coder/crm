import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  const headerList = headers();
  const userPayload = JSON.parse((await headerList).get("x-user") || "{}");

  if (!userPayload.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
    include: { role: true },
  });

  return NextResponse.json(user);
}
