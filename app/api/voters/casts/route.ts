import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET() {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (!user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const castes = await prisma.voter.findMany({
      where: {
        tenantId: user.tenantId,
        caste: { not: null },
      },
      select: { caste: true },
      distinct: ["caste"],
      orderBy: { caste: "asc" },
    });

    return NextResponse.json({
      castes: castes.map((c) => c.caste),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch castes" },
      { status: 500 },
    );
  }
}
