import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    // 1. Authenticate the user from the middleware header
    const headerList = await headers();
    const userHeader = headerList.get("x-user");

    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userHeader);

    // 2. Fetch all workers strictly scoped to this user's tenant
    const workers = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
      },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
        status: true,
        // This is where the magic happens for your UI's micro-stats
       
      },
      orderBy: {
        createdAt: "desc", // Show newest workers at the top
      },
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error("Failed to fetch workers:", error);
    return NextResponse.json(
      { error: "Failed to fetch workers" },
      { status: 500 },
    );
  }
}


export async function POST(req: Request) {
  try {
    const headerList = await headers();
    const userHeader = headerList.get("x-user");

    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = JSON.parse(userHeader);

    // Only SUB_ADMINs or MASTER_ADMINs should create users
    if (currentUser.role === "WORKER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Destructure the new `role` field from the body
    const { name, mobileNumber, password, role } = await req.json();

    if (!name || !mobileNumber || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 2. SECURITY: Strictly enforce allowed roles.
    // Fallback to "WORKER" if they try to pass something invalid.
    const targetRoleName = role === "SUB_ADMIN" ? "SUB_ADMIN" : "WORKER";

    // 3. Check if the mobile number is already in use
    const existingUser = await prisma.user.findUnique({
      where: { mobileNumber },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Mobile number is already registered." },
        { status: 409 },
      );
    }

    // 4. Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Fetch the correct Role ID dynamically based on the selection
    const dbRole = await prisma.role.findUnique({
      where: { name: targetRoleName },
    });

    if (!dbRole) {
      return NextResponse.json(
        { error: `System Error: Role '${targetRoleName}' not found` },
        { status: 500 },
      );
    }

    // 6. Create the new user and assign them to the candidate's tenant
    const newUser = await prisma.user.create({
      data: {
        name,
        mobileNumber,
        passwordHash,
        roleId: dbRole.id, // Will be either SUB_ADMIN or WORKER
        tenantId: currentUser.tenantId,
        status: true,
      },
      select: {
        id: true,
        name: true,
        mobileNumber: true,
      },
    });

    return NextResponse.json({
      message: "Account created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Failed to create account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}