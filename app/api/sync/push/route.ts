import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, secret);
    const tenantId = payload.tenantId as number;
    const workerId = payload.userId as number;

    const { syncItems } = await req.json();
    if (!syncItems || syncItems.length === 0) {
      return NextResponse.json({ message: "Nothing to sync" });
    }

    const processedResults = [];
    
    // Helper to ensure a family exists or create one
    const getRealFamilyId = async (localFamilyId: number | null) => {
      if (!localFamilyId) return null;
      
      // If it looks like a real ID (e.g. small number), check if it exists
      if (localFamilyId < 1000000000) {
        const existing = await prisma.family.findUnique({ where: { id: localFamilyId } });
        if (existing) return localFamilyId;
      }

      // If it's a large random ID from a client, or not found, create a new record
      // We create a new Family and return its real database-assigned ID
      const newFamily = await prisma.family.create({
        data: { tenantId }
      });
      return newFamily.id;
    };

    // Cache to map localFamilyId -> dbFamilyId within this request
    const familyMap = new Map<number, number>();

    for (const item of syncItems) {
      if (item.action === "UPDATE_VOTER") {
        const { id, ...voterData } = item.payload;
        
        let targetFamilyId = voterData.familyId;
        if (targetFamilyId) {
          if (familyMap.has(targetFamilyId)) {
            targetFamilyId = familyMap.get(targetFamilyId);
          } else {
            const dbId = await getRealFamilyId(targetFamilyId);
            familyMap.set(targetFamilyId, dbId!);
            targetFamilyId = dbId;
          }
        }

        const data: any = {
          tenantId,
          fullName: voterData.fullName,
          firstName: voterData.firstName,
          lastName: voterData.lastName,
          age: voterData.age,
          gender: voterData.gender,
          epicNumber: voterData.epicNumber,
          serialNumber: voterData.serialNumber,
          pollingStation: voterData.pollingStation,
          ward: voterData.ward,
          houseNumber: voterData.houseNumber,
          cityVillage: voterData.cityVillage,
          isVisited: voterData.isVisited,
          hasVoted: voterData.hasVoted,
          isStar: voterData.isStar,
          supportLevel: voterData.supportLevel,
          mobileNumber: voterData.mobileNumber,
          caste: voterData.caste,
          notes: voterData.notes,
          familyId: targetFamilyId,
          language: voterData.language,
          lastUpdatedBy: workerId,
          lastUpdatedAt: new Date(),
        };

        if (id > 0) {
          const res = await prisma.voter.update({
            where: { id, tenantId },
            data,
          });
          processedResults.push(res);
        } else {
          // New voter upsert logic
          const existing = await prisma.voter.findFirst({
            where: { epicNumber: data.epicNumber, language: data.language, tenantId }
          });
          if (existing) {
             const res = await prisma.voter.update({ where: { id: existing.id }, data });
             processedResults.push(res);
          } else {
             const res = await prisma.voter.create({ data });
             processedResults.push(res);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: processedResults.length,
    });
  } catch (error) {
    console.error("Push Sync Error:", error);
    return NextResponse.json(
      { error: "Failed to process sync queue" },
      { status: 500 },
    );
  }
}
