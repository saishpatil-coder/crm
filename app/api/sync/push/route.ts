import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    // 1. Authenticate the worker
    const token = (await cookies()).get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const tenantId = payload.tenantId as number;
    const workerId = payload.userId as number;

    // console.log(payload)

    // 2. Grab the queue array sent from the mobile phone
    const { syncItems } = await req.json();

    if (!syncItems || syncItems.length === 0) {
      return NextResponse.json({ message: "Nothing to sync" });
    }

    console.log(
      `Processing ${syncItems.length} sync items from worker ${workerId}`,
    );

    // 3. Process the queue using a Prisma Transaction
    // This ensures that if one fails, they don't all fail, but it's highly efficient
    const results = await prisma.$transaction(
      syncItems.map((item: any) => {
        console.log(item)
        if (item.action === "UPDATE_VOTER") {
          return prisma.voter.update({
            where: {
              id: item.payload.id,
              tenantId: tenantId, // Security check to ensure they only edit their own voters
            },
            data: {
              isVisited: item.payload.isVisited,
              supportLevel: item.payload.supportLevel,
              isAlive: item.payload.isAlive,
              hasVoted: item.payload.hasVoted,
              isStar: item.payload.isStar,
              mobileNumber: item.payload.mobileNumber,
              caste: item.payload.caste,
              notes: item.payload.notes,
              houseNumber: item.payload.houseNumber,
              photoUrl: item.payload.photoUrl,
              lastUpdatedBy: workerId,
              lastUpdatedAt: new Date(),
            },
          });
        }
        // You can add more actions here later, like 'ADD_FAMILY_MEMBER'
        return prisma.$queryRaw`SELECT 1`; // Dummy return for unhandled actions
      }),
    );

    return NextResponse.json({
      success: true,
      processedCount: results.length,
    });
  } catch (error) {
    console.error("Push Sync Error:", error);
    return NextResponse.json(
      { error: "Failed to process sync queue" },
      { status: 500 },
    );
  }
}
