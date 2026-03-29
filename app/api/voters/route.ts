import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const headerList = await headers();
    const userHeader = headerList.get("x-user");

    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jwtUser = JSON.parse(userHeader);
    // or a malformed token), we cannot query the database.
    if (!jwtUser.tenantId) {
      console.warn(
        "API Warning: Attempted to fetch voters without a tenantId.",
      );
      return NextResponse.json([]); // Return an empty array safely instead of crashing Prisma
    }
    // Fetch voters for this specific campaign (tenant)
    let where: any = {
      tenantId: jwtUser.tenantId,
    };

    // --- CRITICAL FIX: ALWAYS FETCH FRESH ASSIGNMENTS ---
    if (jwtUser.role === "WORKER") {
      // Get the most up-to-date booth assignments directly from the database
      // Note: Use jwtUser.id or jwtUser.userId depending on how your JWT is structured
      const dbUser = await prisma.user.findUnique({
        where: { id: jwtUser.id || jwtUser.userId },
        select: { assignedBooths: true },
      });

      const allowedBooths = dbUser?.assignedBooths || [];

      where.pollingStation = {
        // If they have no booths assigned, pass a dummy string so it returns 0 voters safely
        in:
          allowedBooths.length > 0
            ? allowedBooths
            : ["__UNASSIGNED_NO_ACCESS__"],
      };
    }

    const voters = await prisma.voter.findMany({
      where,
      select: {
        id: true,
        epicNumber: true,
        fullName: true,
        gender: true,
        age: true,
        mobileNumber: true,
        ward: true,
        pollingStation: true,
        isVisited: true,
        hasVoted: true,
        supportLevel: true,
        cityVillage: true,
        caste: true,
        serialNumber: true,
      },
      take: 1000, // Good limit for mobile syncing
      orderBy: {
        serialNumber: "asc",
      },
    });

    return NextResponse.json(voters);
  } catch (error) {
    console.error("Failed to fetch voters:", error);
    return NextResponse.json(
      { error: "Failed to fetch voters" },
      { status: 500 },
    );
  }
}