import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (!user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const villageId = searchParams.get("villageId");
    const boothId = searchParams.get("boothId");

    let where: any = {
      tenantId: user.tenantId,
      isDeleted: false,
    };

    if (boothId) {
      where.boothId = Number(boothId);
    }

    if (villageId) {
      where.booth = {
        villageId: Number(villageId),
      };
    }

    // Worker restriction
    if (user.role === "WORKER") {
      const assignments = await prisma.userBoothAssignment.findMany({
        where: { userId: user.userId },
        select: { boothId: true },
      });

      const allowedBooths = assignments.map((a) => a.boothId);

      where.boothId = {
        in: allowedBooths.length > 0 ? allowedBooths : [-1],
      };
    }

    const [total, supporters, opponents, neutral, starVoters, votedCount] =
      await Promise.all([
        prisma.voter.count({ where }),
        prisma.voter.count({
          where: { ...where, supportStatus: "SUPPORTER" },
        }),
        prisma.voter.count({
          where: { ...where, supportStatus: "OPPONENT" },
        }),
        prisma.voter.count({
          where: { ...where, supportStatus: "NEUTRAL" },
        }),
        prisma.voter.count({
          where: { ...where, isStarVoter: true },
        }),
        prisma.voter.count({
          where: { ...where, hasVoted: true },
        }),
      ]);

    const supporterPercentage =
      total > 0 ? ((supporters / total) * 100).toFixed(2) : "0.00";

    return NextResponse.json({
      totalVoters: total,
      supporters,
      opponents,
      neutral,
      starVoters,
      votedCount,
      supporterPercentage,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
