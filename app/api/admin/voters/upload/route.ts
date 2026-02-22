import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Papa from "papaparse";
import { cleanMobile, normalizeGender, parseAge } from "@/lib/voterParser/cleaner";
import { getDbKeyFromHeader } from "@/lib/voterParser/headerMap";
import { prisma } from "@/lib/prisma";
// import {
//   normalizeGender,
//   parseAge,
//   cleanMobile,
// } from "@/lib/voterParser/cleaner";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the User
    const headerList = await headers();
    const userHeader = headerList.get("x-user");
    if (!userHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = JSON.parse(userHeader);
    if (user.role !== "MASTER_ADMIN" && user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Extract the file from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const language = formData.get("language") as string; // Optional: to handle language-specific parsing if needed
console.log(language)
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Convert file to text (Next.js FormData easily handles MBs of text)
    const fileText = await file.text();

    // 4. Parse CSV using PapaParse
    const parsedData = Papa.parse(fileText, {
      header: true    });

    if (parsedData.errors.length > 0) {
      console.warn("CSV Parsing warnings:", parsedData.errors);
    }

    const rows = parsedData.data as any[];
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "The uploaded CSV file is empty" },
        { status: 400 },
      );
    }

    // 5. Map Headers Dynamically
    // Take the keys from the first row and map them to our Database Schema Keys
    const rawHeaders = Object.keys(rows[0]);
    const headerMapping: Record<string, string> = {};

    for (const rawHeader of rawHeaders) {
      const dbKey = getDbKeyFromHeader(rawHeader);
      if (dbKey) {
        headerMapping[rawHeader] = dbKey;
      }
    }


    // If we didn't find the crucial EPIC number column, abort
    if (!Object.values(headerMapping).includes("epicNumber")) {
      return NextResponse.json(
        {
          error:
            "Could not find 'Card Number' or 'EPIC' column in the CSV. Please check the format.",
        },
        { status: 400 },
      );
    }

    // 6. Transform Rows into Prisma Objects
    const votersToInsert: any[] = [];
    let skippedRows = 0;

    for (const row of rows) {
      const voterData: any = {
        tenantId: user.tenantId,
        isAlive: true,
        isVisited: false,
        hasVoted: false,
        supportLevel: "UNKNOWN",
        lastUpdatedBy: user.id,
        language
      };

      // Apply mapping and cleaning
      for (const [rawHeader, dbKey] of Object.entries(headerMapping)) {
        const rawValue = row[rawHeader];
        if (true) {
          // Apply specific cleaners based on the column
          if (dbKey === "gender") {
            voterData[dbKey] = normalizeGender(rawValue);
          } else if (dbKey === "age") {
            voterData[dbKey] = parseAge(rawValue);
          } else if (dbKey === "mobileNumber") {
            voterData[dbKey] = cleanMobile(rawValue);
          } else if (dbKey === "serialNumber") {
            voterData[dbKey] = parseInt(rawValue, 10) || null;
          } else {
            // Strings: trim leading/trailing spaces
            voterData[dbKey] = String(rawValue).trim();
          }
        }
      }

      // Final validation before queueing: EPIC is mandatory
      if (voterData.epicNumber) {
        votersToInsert.push(voterData);
      } else {
        skippedRows++;
      }
    }

    // 7. Batch Insertion (The fast way)
    // We insert in chunks of 5000 to prevent hitting Postgres connection limits
    const BATCH_SIZE = 5000;
    let insertedCount = 0;
    console.log(votersToInsert[0]);
    for (let i = 0; i < votersToInsert.length; i += BATCH_SIZE) {
      const batch = votersToInsert.slice(i, i + BATCH_SIZE);
        // console.log(batch)
      const result = await prisma.voter.createMany({
        data: batch,
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
      { error: "Failed to process CSV file." },
      { status: 500 },
    );
  }
}
