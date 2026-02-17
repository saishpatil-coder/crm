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

    let boothFilter: any = {
      tenantId: user.tenantId,
    };

    if (villageId) {
      boothFilter.villageId = Number(villageId);
    }

    // Worker restriction
    if (user.role === "WORKER") {
      const assignments = await prisma.userBoothAssignment.findMany({
        where: { userId: user.userId },
        select: { boothId: true },
      });

      const allowedBooths = assignments.map((a) => a.boothId);

      boothFilter.id = {
        in: allowedBooths.length > 0 ? allowedBooths : [-1],
      };
    }

    const booths = await prisma.booth.findMany({
      where: boothFilter,
      include: {
        village: true,
        voters: {
          where: { isDeleted: false },
        },
      },
    });

    const result = booths.map((booth) => {
      const total = booth.voters.length;

      const supporters = booth.voters.filter(
        (v) => v.supportStatus === "SUPPORTER",
      ).length;

      const opponents = booth.voters.filter(
        (v) => v.supportStatus === "OPPONENT",
      ).length;

      const neutral = booth.voters.filter(
        (v) => v.supportStatus === "NEUTRAL",
      ).length;

      const star = booth.voters.filter((v) => v.isStarVoter).length;

      const supporterPercentage = total > 0 ? (supporters / total) * 100 : 0;

      let strengthTag = "WEAK";

      if (supporterPercentage >= 60) strengthTag = "STRONG";
      else if (supporterPercentage >= 40) strengthTag = "MEDIUM";

      return {
        boothId: booth.id,
        boothNumber: booth.boothNumber,
        village: booth.village.name,
        total,
        supporters,
        opponents,
        neutral,
        starVoters: star,
        supporterPercentage: supporterPercentage.toFixed(2),
        strengthTag,
      };
    });

    return NextResponse.json({ booths: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch booth performance" },
      { status: 500 },
    );
  }
}
