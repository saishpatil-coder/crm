import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    // 🔐 Only MASTER_ADMIN allowed
    if (user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      candidateName,
      constituencyNumber,
      constituencyName,
      subAdminName,
      subAdminMobile,
    } = body;

    if (
      !name ||
      !candidateName ||
      !constituencyNumber ||
      !constituencyName ||
      !subAdminName ||
      !subAdminMobile
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const subAdminRole = await prisma.role.findFirst({
      where: { name: "SUB_ADMIN" },
    });

    if (!subAdminRole) {
      return NextResponse.json(
        { error: "SUB_ADMIN role not found" },
        { status: 500 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          candidateName,
          constituencyNumber: String(constituencyNumber),
          constituencyName,
        },
      });

      // 2️⃣ Create Sub Admin User
      const subAdmin = await tx.user.create({
        data: {
          name: subAdminName,
          mobileNumber: subAdminMobile,
          roleId: subAdminRole.id,
          tenantId: tenant.id,
        },
      });

      return { tenant, subAdmin };
    });

    return NextResponse.json({
      message: "Tenant created successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const headerList = headers();
  const user = JSON.parse((await headerList).get("x-user") || "{}");

  // MASTER_ADMIN sees all tenants
  if (user.role === "MASTER_ADMIN") {
    const tenants = await prisma.tenant.findMany();
    return NextResponse.json({ tenants });
  }

  // SUB_ADMIN sees only their tenant
  if (user.role === "SUB_ADMIN") {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: {
        _count: {
          select: { users: true, voters: true }, // Grab the live stats!
        },
      },
    });

    // Wrap the tenant in an array so the frontend useOfflineData hook
    // can successfully save it to the localDb using bulkPut()
    return NextResponse.json(tenant ? [tenant] : []);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
