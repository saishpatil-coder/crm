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

    const villages = await prisma.village.findMany({
      where: {
        tenantId: user.tenantId,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ villages });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch villages" },
      { status: 500 },
    );
  }
}
