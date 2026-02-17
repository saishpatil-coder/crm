import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { parse } from "csv-parse/sync";

const BATCH_SIZE = 1000;

export async function POST(req: NextRequest) {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "CSV file required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const csvText = buffer.toString("utf-8");

    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    const tenantId = user.tenantId;

    // -------------------------------------------------
    // 1️⃣ PRELOAD EXISTING VILLAGES & BOOTHS
    // -------------------------------------------------

    const existingVillages = await prisma.village.findMany({
      where: { tenantId },
    });

    const existingBooths = await prisma.booth.findMany({
      where: { tenantId },
    });

    const villageMap = new Map<string, number>();
    const boothMap = new Map<string, number>();

    existingVillages.forEach((v) => {
      villageMap.set(v.name.toLowerCase(), v.id);
    });

    existingBooths.forEach((b) => {
      boothMap.set(`${b.villageId}-${b.boothNumber}`, b.id);
    });

    let newVillages: { name: string; tenantId: number }[] = [];
    let newBooths: any[] = [];
    let batch: any[] = [];
    let insertedCount = 0;

    // -------------------------------------------------
    // 2️⃣ FIRST PASS – CREATE MISSING VILLAGES & BOOTHS
    // -------------------------------------------------

    for (const row of records) {
      const villageName = row["मुख्य शहर"]?.trim() || "UNKNOWN";
      const boothNumber = row["मतदान केंद्र"]?.trim() || "UNKNOWN";

      const normalizedVillage = villageName.toLowerCase();

      if (!villageMap.has(normalizedVillage)) {
        newVillages.push({
          tenantId,
          name: villageName,
        });
        villageMap.set(normalizedVillage, -1); // temporary
      }
    }

    if (newVillages.length > 0) {
      await prisma.village.createMany({
        data: newVillages,
        skipDuplicates: true,
      });

      const refreshedVillages = await prisma.village.findMany({
        where: { tenantId },
      });

      refreshedVillages.forEach((v) => {
        villageMap.set(v.name.toLowerCase(), v.id);
      });
    }

    // -------------------------------------------------
    // 3️⃣ PREPARE BOOTHS
    // -------------------------------------------------

    for (const row of records) {
      const villageName = row["मुख्य शहर"]?.trim() || "UNKNOWN";
      const boothNumber = row["मतदान केंद्र"]?.trim() || "UNKNOWN";

      const villageId = villageMap.get(villageName.toLowerCase());

      const boothKey = `${villageId}-${boothNumber}`;

      if (!boothMap.has(boothKey)) {
        newBooths.push({
          tenantId,
          villageId,
          boothNumber,
        });
        boothMap.set(boothKey, -1);
      }
    }

    if (newBooths.length > 0) {
      await prisma.booth.createMany({
        data: newBooths,
        skipDuplicates: true,
      });

      const refreshedBooths = await prisma.booth.findMany({
        where: { tenantId },
      });

      refreshedBooths.forEach((b) => {
        boothMap.set(`${b.villageId}-${b.boothNumber}`, b.id);
      });
    }

    // -------------------------------------------------
    // 4️⃣ INSERT VOTERS (BATCHED)
    // -------------------------------------------------

    for (const row of records) {
      const villageName = row["मुख्य शहर"]?.trim() || "UNKNOWN";
      const boothNumber = row["मतदान केंद्र"]?.trim() || "UNKNOWN";
      const voterIdNumber = row["Card Number"]?.trim();

      if (!voterIdNumber) continue;

      const villageId = villageMap.get(villageName.toLowerCase());
      const boothId = boothMap.get(`${villageId}-${boothNumber}`);

      batch.push({
        tenantId,
        boothId,
        voterIdNumber,
        name: row["नाव"] || "",
        age: row["वय"] ? parseInt(row["वय"]) : null,
        gender: row["लिंग"] || null,
        caste: row["Cast"]?.trim() || null,
        mobileNumber: row["Mobile Number"] || null,
        addressLine1: row["पत्ता"] || null,
      });

      if (batch.length >= BATCH_SIZE) {
        const result = await prisma.voter.createMany({
          data: batch,
          skipDuplicates: true,
        });

        insertedCount += result.count;
        batch = [];
      }
    }

    if (batch.length > 0) {
      const result = await prisma.voter.createMany({
        data: batch,
        skipDuplicates: true,
      });

      insertedCount += result.count;
    }

    return NextResponse.json({
      message: "Import completed successfully",
      inserted: insertedCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
