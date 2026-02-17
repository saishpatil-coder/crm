import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { workerId, boothIds } = await req.json();

    if (!workerId || !boothIds || !Array.isArray(boothIds)) {
      return NextResponse.json(
        { error: "workerId and boothIds required" },
        { status: 400 },
      );
    }

    const assignments = boothIds.map((boothId: number) => ({
      tenantId: user.tenantId,
      userId: workerId,
      boothId,
    }));

    await prisma.userBoothAssignment.createMany({
      data: assignments,
      skipDuplicates: true,
    });

    return NextResponse.json({
      message: "Booths assigned successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Assignment failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const headerList = headers();
  const user = JSON.parse((await headerList).get("x-user") || "{}");

  const { searchParams } = new URL(req.url);
  const workerId = searchParams.get("workerId");

  const assignments = await prisma.userBoothAssignment.findMany({
    where: {
      userId: Number(workerId),
      tenantId: user.tenantId,
    },
    include: {
      booth: {
        include: { village: true },
      },
    },
  });

  return NextResponse.json({ assignments });
}

export async function DELETE(req: Request) {
  const headerList = headers();
  const user = JSON.parse((await headerList).get("x-user") || "{}");

  const { workerId, boothId } = await req.json();

  await prisma.userBoothAssignment.deleteMany({
    where: {
      tenantId: user.tenantId,
      userId: workerId,
      boothId,
    },
  });

  return NextResponse.json({ message: "Assignment removed" });
}
