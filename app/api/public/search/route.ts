import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 10;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const epic = searchParams.get("epic")?.trim();
    const fName = searchParams.get("fName")?.trim();
    const mName = searchParams.get("mName")?.trim();
    const lName = searchParams.get("lName")?.trim();
    const exact = searchParams.get("exact") === "true";

    if (!slug) {
      return NextResponse.json({ error: "Missing campaign identifier." }, { status: 400 });
    }

    const isEpicSearch = Boolean(epic);
    const hasNameSearch = Boolean(fName || lName);

    if (!isEpicSearch && !hasNameSearch) {
      return NextResponse.json({ error: "Please enter EPIC number or Name." }, { status: 400 });
    }

    // Name search minimum length validation
    if (!isEpicSearch && hasNameSearch) {
      if ((fName && fName.length < MIN_QUERY_LENGTH) || (lName && lName.length < MIN_QUERY_LENGTH)) {
        return NextResponse.json({ error: `Searching by name requires at least ${MIN_QUERY_LENGTH} characters for First and Last name.`, code: "QUERY_TOO_SHORT" }, { status: 400 });
      }
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, candidateName: true, partyName: true, partyLogoUrl: true, candidatePhotoUrl: true, constituencyName: true },
    });

    if (!tenant) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

    // Build query
    let whereClause: any = { tenantId: tenant.id };

    if (isEpicSearch) {
      whereClause.epicNumber = exact ? { equals: epic } : { contains: epic };
    } else {
      // Build an AND array for the name parts that are present
      const nameConditions = [];
      if (fName) nameConditions.push({ fullName: { contains: fName } });
      if (mName) nameConditions.push({ fullName: { contains: mName } });
      if (lName) nameConditions.push({ fullName: { contains: lName } });
      
      whereClause.AND = nameConditions;
    }

    const voters = await prisma.voter.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        epicNumber: true,
        serialNumber: true,
        pollingStation: true,
        ward: true,
        age: true,
        gender: true,
        cityVillage: true,
      },
      take: MAX_RESULTS + 1,
      orderBy: { serialNumber: "asc" },
    });

    const hasMore = voters.length > MAX_RESULTS;
    const results = hasMore ? voters.slice(0, MAX_RESULTS) : voters;

    // Further local filtering for "Exact Search" to make sure the tokens strictly match boundaries (optional but can be added here)

    return NextResponse.json({
      tenant,
      results,
      hasMore,
      resultCount: results.length,
    });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
