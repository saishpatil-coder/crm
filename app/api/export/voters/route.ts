import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (!user.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const caste = searchParams.get("caste");
    const villageId = searchParams.get("villageId");
    const boothId = searchParams.get("boothId");

    let where: any = {
      tenantId: user.tenantId,
      isDeleted: false,
    };

    if (caste) where.caste = caste;
    if (boothId) where.boothId = Number(boothId);
    if (villageId) {
      where.booth = { villageId: Number(villageId) };
    }

    // Worker restriction
    if (user.role === "WORKER") {
      const assignments = await prisma.userBoothAssignment.findMany({
        where: { userId: user.userId },
        select: { boothId: true },
      });

      const allowedBooths = assignments.map((a) => a.boothId);

      where.boothId = {
        in: allowedBooths.length > 0 ? allowedBooths : [-1],
      };
    }

    const voters = await prisma.voter.findMany({
      where,
      include: {
        booth: {
          include: { village: true },
        },
      },
    });

    const formatted = voters.map((v) => ({
      Name: v.name,
      Age: v.age,
      Gender: v.gender,
      Caste: v.caste,
      Mobile: v.mobileNumber,
      Village: v.booth.village.name,
      Booth: v.booth.boothNumber,
      SupportStatus: v.supportStatus,
      HasVoted: v.hasVoted,
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Voters");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Log export
    await prisma.exportLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.userId,
        exportType: "VOTER_EXPORT",
        filtersJson: {},
      },
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Disposition": "attachment; filename=voters.xlsx",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
