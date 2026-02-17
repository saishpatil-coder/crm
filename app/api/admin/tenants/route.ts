import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

//////////////////////////////////////////////////////////
// GET ALL TENANTS
//////////////////////////////////////////////////////////

export async function GET() {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            voters: true,
            booths: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(tenants[0])

    return NextResponse.json(tenants);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch tenants" },
      { status: 500 },
    );
  }
}

//////////////////////////////////////////////////////////
// CREATE TENANT
//////////////////////////////////////////////////////////

export async function POST(req: Request) {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    console.log(body)
    const {
      candidateName,
      partyName,
      constituencyName,
      constituencyNumber,
      subAdminName,
      subAdminMobile,
      password,
      candidateImageBase64,
      partyLogoBase64,
    } = body;

    if (
      !candidateName ||
      !constituencyName ||
      !subAdminName ||
      !subAdminMobile ||
      !password
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const subAdminRole = await prisma.role.findUnique({
      where: { name: "SUB_ADMIN" },
    });

    if (!subAdminRole) {
      return NextResponse.json(
        { error: "SUB_ADMIN role not found" },
        { status: 400 },
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          candidateName,
          partyName,
          constituencyName,
          constituencyNumber,
          partyLogoUrl:partyLogoBase64,
          candidatePhotoUrl:candidateImageBase64
        },
      });

      await tx.user.create({
        data: {
          name: subAdminName,
          mobileNumber: subAdminMobile,
          passwordHash: hash,
          roleId: subAdminRole.id,
          tenantId: tenant.id,
        },
      });

      return tenant;
    });

    return NextResponse.json({
      message: "Tenant created successfully",
      tenantId: result.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create tenant" },
      { status: 500 },
    );
  }
}
