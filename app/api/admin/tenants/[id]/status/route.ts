import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }, // 1. Type as Promise
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
    const { status } = await req.json();

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });

    return NextResponse.json({
      message: "Tenant status updated",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}
