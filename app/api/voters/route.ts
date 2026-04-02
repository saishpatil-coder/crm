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
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get("lang");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "1000", 10);
    
    const skip = (page - 1) * limit;
    const take = limit;
    
    // Map short codes to full database names
    const langMap: Record<string, string> = {
      en: "English",
      mr: "Marathi",
      hi: "Hindi"
    };
    const dbLang = lang ? langMap[lang] || lang : undefined;

    // Fetch voters for this specific campaign (tenant)
    let where: any = {
      tenantId: jwtUser.tenantId,
    };

    if (dbLang) {
      where.language = dbLang;
    }

    // --- CRITICAL FIX: ALWAYS FETCH FRESH ASSIGNMENTS ---
    if (jwtUser.role === "WORKER") {
      // Get the most up-to-date booth assignments directly from the database
      // Note: Use jwtUser.id or jwtUser.userId depending on how your JWT is structured
      const dbUser = await prisma.user.findUnique({
        where: { id: jwtUser.id || jwtUser.userId },
        select: { assignedBooths: true },
      });

      const allowedBooths = dbUser?.assignedBooths || [];

      if (allowedBooths.length > 0) {
        // Step 1: Find one sample voter for EACH assigned booth to get an EPIC number
        const sampleVoters = await prisma.voter.findMany({
          where: { tenantId: jwtUser.tenantId, pollingStation: { in: allowedBooths } },
          select: { epicNumber: true, pollingStation: true },
          distinct: ['pollingStation'],
        });

        const epicNumbers = sampleVoters.map((v) => v.epicNumber).filter(Boolean);

        // Step 2: Search for those specific EPIC numbers across ALL languages to get translated names
        let translatedBooths: string[] = [];
        if (epicNumbers.length > 0) {
          const translations = await prisma.voter.findMany({
            where: { tenantId: jwtUser.tenantId, epicNumber: { in: epicNumbers } },
            select: { pollingStation: true },
            distinct: ['pollingStation'],
          });

          translatedBooths = translations
            .map((v) => v.pollingStation)
            .filter(Boolean) as string[];
        }

        // Step 3: Combine original booths and translated booths into a single array
        const finalBooths = Array.from(new Set([...allowedBooths, ...translatedBooths]));

        where.pollingStation = {
          in: finalBooths,
        };
      } else {
        where.pollingStation = {
          in: ["__UNASSIGNED_NO_ACCESS__"],
        };
      }
    }

    // Fallback logic: If no voters exist for this language, fallback to Marathi
    if (dbLang && dbLang !== "Marathi") {
      const count = await prisma.voter.count({ where });
      if (count === 0) {
        where.language = "Marathi";
      }
    }

    let voters = await prisma.voter.findMany({
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
        photoUrl: true,
        language: true,
      },
      skip,
      take,
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