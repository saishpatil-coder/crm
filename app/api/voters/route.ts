// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { headers } from "next/headers";

// export async function GET(req: Request) {
//   try {
//     const headerList = headers();
//     const user = JSON.parse((await headerList).get("x-user") || "{}");

//     if (!user.userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const { searchParams } = new URL(req.url);

//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "20");

//     const caste = searchParams.get("caste");
//     const villageId = searchParams.get("villageId");
//     const boothId = searchParams.get("boothId");

//     const skip = (page - 1) * limit;

//     // -----------------------------
//     // 1️⃣ Base Filter
//     // -----------------------------

//     let where: any = {
//       tenantId: user.tenantId,
//       isDeleted: false,
//     };

//     if (caste) where.caste = caste;
//     if (boothId) where.boothId = Number(boothId);

//     if (villageId) {
//       where.booth = {
//         villageId: Number(villageId),
//       };
//     }

//     // -----------------------------
//     // 2️⃣ Worker Restriction
//     // -----------------------------

//     if (user.role === "WORKER") {
//       const assignments = await prisma.userBoothAssignment.findMany({
//         where: {
//           userId: user.userId,
//         },
//         select: {
//           boothId: true,
//         },
//       });

//       const allowedBooths = assignments.map((a) => a.boothId);

//       where.boothId = {
//         in: allowedBooths.length > 0 ? allowedBooths : [-1],
//       };
//     }

//     // -----------------------------
//     // 3️⃣ Fetch Data
//     // -----------------------------

//     const [voters, total] = await Promise.all([
//       prisma.voter.findMany({
//         where,
//         skip,
//         take: limit,
//         include: {
//           booth: {
//             include: {
//               village: true,
//             },
//           },
//         },
//         orderBy: { createdAt: "desc" },
//       }),
//       prisma.voter.count({ where }),
//     ]);

//     return NextResponse.json({
//       page,
//       limit,
//       total,
//       data: voters,
//     });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Failed to fetch voters" },
//       { status: 500 },
//     );
//   }
// }
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const headerList = await headers();
    const userHeader = headerList.get("x-user");

    if (!userHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = JSON.parse(userHeader);

    // Fetch voters for this specific campaign (tenant)
    const voters = await prisma.voter.findMany({
      where: {
        tenantId: user.tenantId,
        // Optional: If you want workers to only see their assigned voters, uncomment below:
        // assignedWorkerId: user.role === "WORKER" ? user.id : undefined,
      },
      select: {
        id: true,
        epicNumber: true,
        fullName: true,
        gender: true,
        age: true,
        mobileNumber: true,
        ward: true,
        pollingStation: true,
        isVisited: true,
        hasVoted: true,
        supportLevel: true,
      },
      take: 1000, // Limit to 1000 for mobile performance; implement search later for more
      orderBy: {
        serialNumber: "asc",
      },
    });

    return NextResponse.json(voters);
  } catch (error) {
    console.error("Failed to fetch voters:", error);
    return NextResponse.json(
      { error: "Failed to fetch voters" },
      { status: 500 },
    );
  }
}