import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [totalTenants, totalUsers, totalWorkers, totalVoters, recentTenants] =
      await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.user.count({
          where: { role: { name: "WORKER" } },
        }),
        prisma.voter.count(),
        prisma.tenant.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            candidateName: true,
            constituencyName: true,
            createdAt: true,
          },
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalTenants,
        totalUsers,
        totalWorkers,
        totalVoters,
      },
      recentTenants,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 },
    );
  }
}
