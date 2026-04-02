import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const headerList = await headers();
    const userHeader = headerList.get("x-user");

    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = JSON.parse(userHeader);
    const resolvedParams = await params;
    const workerId = parseInt(resolvedParams.id, 10);

    if (isNaN(workerId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const worker = await prisma.user.findFirst({
      where: {
        id: workerId,
        tenantId: currentUser.tenantId, // Ensure it's in their tenant
      },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        status: true,
        assignedBooths: true,
        role: {
          select: { name: true }
        }
      },
    });

    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Flatten role for frontend simplicity
    return NextResponse.json({
      ...worker,
      role: worker.role?.name || "WORKER",
    });
  } catch (error) {
    console.error("Failed to fetch worker details:", error);
    return NextResponse.json(
      { error: "Failed to fetch worker details" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const headerList = await headers();
    const userHeader = headerList.get("x-user");

    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = JSON.parse(userHeader);

    // Only SUB_ADMINs or MASTER_ADMINs should update users
    if (currentUser.role === "WORKER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const workerId = parseInt(resolvedParams.id, 10);

    if (isNaN(workerId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { name, mobileNumber, password, role, assignedBooths } = await req.json();

    if (!name || !mobileNumber) {
      return NextResponse.json(
        { error: "Name and Mobile Number are required" },
        { status: 400 },
      );
    }

    // Check if the user trying to be edited actually belongs to this tenant
    const existingWorker = await prisma.user.findFirst({
      where: { id: workerId, tenantId: currentUser.tenantId },
    });

    if (!existingWorker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    // Prevent duplicate mobile numbers on update (unless it's the SAME user's mobile)
    if (mobileNumber !== existingWorker.mobileNumber) {
      const existingMobile = await prisma.user.findUnique({
        where: { mobileNumber },
      });

      if (existingMobile) {
        return NextResponse.json(
          { error: "Mobile number is already registered to another user." },
          { status: 409 },
        );
      }
    }

    // SECURITY: Strictly enforce allowed roles.
    const targetRoleName = role === "SUB_ADMIN" ? "SUB_ADMIN" : "WORKER";
    const dbRole = await prisma.role.findUnique({
      where: { name: targetRoleName },
    });

    if (!dbRole) {
      return NextResponse.json(
        { error: `System Error: Role '${targetRoleName}' not found` },
        { status: 500 },
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      mobileNumber,
      roleId: dbRole.id,
      assignedBooths: assignedBooths || [],
    };

    // If a new password is provided, hash and include it in the update
    if (password && password.trim().length >= 6) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: workerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        mobileNumber: true,
      },
    });

    return NextResponse.json({
      message: "Account updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Failed to update account:", error);
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 },
    );
  }
}
