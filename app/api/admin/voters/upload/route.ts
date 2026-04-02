import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Papa from "papaparse";
import {
  cleanMobile,
  normalizeGender,
  parseAge,
} from "@/lib/voterParser/cleaner";
import { getDbKeyFromHeader } from "@/lib/voterParser/headerMap";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the User
    const headerList = await headers();
    const userHeader = headerList.get("x-user");
    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userHeader);
    if (user.role !== "MASTER_ADMIN" && user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Extract FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const language = (formData.get("language") as string) || "English";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // A 10,000 row CSV is typically only ~1.5MB, so file.text() is memory-safe here.
    const fileText = await file.text();

    // 3. Parse CSV using PapaParse (Skip empty lines to prevent undefined rows)
    const parsedData = Papa.parse(fileText, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsedData.data as any[];
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "The uploaded CSV file is empty" },
        { status: 400 },
      );
    }

    // 4. Map Headers Dynamically
    const rawHeaders = Object.keys(rows[0]);
    const headerMapping: Record<string, string> = {};

    for (const rawHeader of rawHeaders) {
      const dbKey = getDbKeyFromHeader(rawHeader);
      if (dbKey) {
        headerMapping[rawHeader] = dbKey;
      }
    }

    if (!Object.values(headerMapping).includes("epicNumber")) {
      return NextResponse.json(
        { error: "Could not find 'Card Number' or 'EPIC' column in the CSV." },
        { status: 400 },
      );
    }

    // 5. Transform Rows safely
    const votersToInsert: any[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      // Set baseline defaults
      const voterData: any = {
        tenantId: Number(user.tenantId),
        isAlive: true,
        isVisited: false,
        hasVoted: false,
        supportLevel: "UNKNOWN",
        language: language,
      };

      // Apply mapping and cleaning ONLY if the CSV cell actually has data
      for (const [rawHeader, dbKey] of Object.entries(headerMapping)) {
        const rawValue = row[rawHeader];

        // Protect against empty strings or undefined cells overwriting our defaults
        if (
          rawValue !== undefined &&
          rawValue !== null &&
          String(rawValue).trim() !== ""
        ) {
          if (dbKey === "gender") {
            voterData[dbKey] = normalizeGender(rawValue);
          } else if (dbKey === "age") {
            voterData[dbKey] = parseAge(rawValue);
          } else if (dbKey === "mobileNumber") {
            voterData[dbKey] = cleanMobile(rawValue);
          } else if (dbKey === "serialNumber") {
            voterData[dbKey] = parseInt(rawValue as string, 10) || null;
          } else {
            voterData[dbKey] = String(rawValue).trim();
          }
        }
      }

      // Mandatory check: Must have an EPIC number to insert
      if (voterData.epicNumber) {
        votersToInsert.push(voterData);
      } else {
        skippedRows++;
      }
    }

    // 6. Industry Standard Batch Insertion
    // MAX 2000 to avoid PostgreSQL 65,535 parameter limit crash
    const BATCH_SIZE = 2000;
    let insertedCount = 0;

    for (let i = 0; i < votersToInsert.length; i += BATCH_SIZE) {
      const batch = votersToInsert.slice(i, i + BATCH_SIZE);

      const result = await prisma.voter.createMany({
        data: batch,
        // skipDuplicates: true, // CRITICAL: Don't crash the batch if 1 EPIC already exists!
      });

      insertedCount += result.count;
    }

    return NextResponse.json({
      success: true,
      message: "Voter data processed successfully",
      stats: {
        totalRowsFound: rows.length,
        successfullyInserted: insertedCount,
        skippedDueToMissingEpic: skippedRows,
        duplicatesSkipped: votersToInsert.length - insertedCount,
      },
    });
  } catch (error) {
    console.error("CSV Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV file on the server." },
      { status: 500 },
    );
  }
}
