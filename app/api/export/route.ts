import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // Extract all possible filters
    const village = searchParams.get("village");
    const booth = searchParams.get("booth");
    const caste = searchParams.get("caste");
    const minAge = searchParams.get("minAge");
    const maxAge = searchParams.get("maxAge");
    const supportLevel = searchParams.get("supportLevel");
    const hasVoted = searchParams.get("hasVoted");
    const isVisited = searchParams.get("isVisited");

    // Build the dynamic Prisma WHERE clause
    const whereClause: any = {};

    if (village)
      whereClause.cityVillage = { contains: village, mode: "insensitive" };
    if (booth)
      whereClause.pollingStation = { contains: booth, mode: "insensitive" };
    if (caste) whereClause.caste = { contains: caste, mode: "insensitive" };

    // Age Range Logic
    if (minAge || maxAge) {
      whereClause.age = {};
      if (minAge) whereClause.age.gte = parseInt(minAge);
      if (maxAge) whereClause.age.lte = parseInt(maxAge);
    }

    // Exact matches for Statuses
    if (supportLevel) whereClause.supportLevel = supportLevel;
    if (hasVoted !== null) whereClause.hasVoted = hasVoted === "true";
    if (isVisited !== null) whereClause.isVisited = isVisited === "true";

    // Fetch the data (Order by Serial Number for a clean list)
    const voters = await prisma.voter.findMany({
      where: whereClause,
      orderBy: { serialNumber: "asc" },
      select: {
        epicNumber: true,
        serialNumber: true,
        fullName: true,
        gender: true,
        age: true,
        mobileNumber: true,
        cityVillage: true,
        pollingStation: true,
        caste: true,
        supportLevel: true,
        hasVoted: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: voters.length,
      data: voters,
    });
  } catch (error) {
    console.error("Export API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch export data" },
      { status: 500 },
    );
  }
}
