import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // 2. Await the params!
    const resolvedParams = await params;
    const tenantId = parseInt(resolvedParams.id);
    console.log("Tenant Id recieved : ", tenantId);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            voters: true,
            booths: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch tenant" },
      { status: 500 },
    );
  }
}

// ... (Your existing GET function is here) ...

//////////////////////////////////////////////////////////
// UPDATE TENANT & SUB-ADMIN PASSWORD
//////////////////////////////////////////////////////////

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate Master Admin
    const headerList = headers();
    const user = JSON.parse((await headerList).get("x-user") || "{}");

    if (user.role !== "MASTER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Parse ID and Body
    const resolvedParams = await params;
    const tenantId = parseInt(resolvedParams.id);
    const body = await req.json();

    const {
      candidateName,
      partyName,
      constituencyName,
      constituencyNumber,
      candidateImageBase64,
      partyLogoBase64,
      newPassword,
    } = body;

    // 3. Build the update payload dynamically
    // We only update image URLs if the frontend sent a new Base64 string
    const updateData: any = {
      candidateName,
      partyName,
      constituencyName,
      constituencyNumber,
    };

    if (candidateImageBase64) {
      updateData.candidatePhotoUrl = candidateImageBase64;
    }

    if (partyLogoBase64) {
      updateData.partyLogoUrl = partyLogoBase64;
    }

    // 4. Execute Transaction (Update Tenant + Optional Password Reset)
    const updatedTenant = await prisma.$transaction(async (tx) => {
      // Update the Tenant details
      const tenant = await tx.tenant.update({
        where: { id: tenantId },
        data: updateData,
        include: {
          _count: {
            select: { users: true, voters: true, booths: true },
          },
        },
      });

      // Update Sub-Admin password if a new one was provided
      if (newPassword && newPassword.trim() !== "") {
        const hash = await bcrypt.hash(newPassword, 10);

        // Find the SUB_ADMIN role ID
        const subAdminRole = await tx.role.findUnique({
          where: { name: "SUB_ADMIN" },
        });

        if (subAdminRole) {
          // Update the password for all SUB_ADMIN users belonging to this tenant
          // (Usually, there is only one per tenant)
          await tx.user.updateMany({
            where: {
              tenantId: tenantId,
              roleId: subAdminRole.id,
            },
            data: {
              passwordHash: hash,
            },
          });
        }
      }

      return tenant;
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Failed to update tenant:", error);
    return NextResponse.json(
      { error: "Failed to update campaign details" },
      { status: 500 },
    );
  }
}