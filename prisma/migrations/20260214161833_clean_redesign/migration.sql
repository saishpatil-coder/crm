/*
  Warnings:

  - You are about to drop the column `logoUrl` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `ganId` on the `Village` table. All the data in the column will be lost.
  - You are about to drop the column `religion` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `versionNumber` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the `Constituency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Gan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `otp` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenantId,boothNumber]` on the table `Booth` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,name]` on the table `Village` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Constituency" DROP CONSTRAINT "Constituency_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Gan" DROP CONSTRAINT "Gan_constituencyId_fkey";

-- DropForeignKey
ALTER TABLE "Gan" DROP CONSTRAINT "Gan_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Village" DROP CONSTRAINT "Village_ganId_fkey";

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "logoUrl",
ADD COLUMN     "candidatePhotoUrl" TEXT,
ADD COLUMN     "partyLogoUrl" TEXT;

-- AlterTable
ALTER TABLE "Village" DROP COLUMN "ganId";

-- AlterTable
ALTER TABLE "Voter" DROP COLUMN "religion",
DROP COLUMN "versionNumber";

-- DropTable
DROP TABLE "Constituency";

-- DropTable
DROP TABLE "Gan";

-- DropTable
DROP TABLE "otp";

-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Otp_mobileNumber_idx" ON "Otp"("mobileNumber");

-- CreateIndex
CREATE INDEX "Booth_villageId_idx" ON "Booth"("villageId");

-- CreateIndex
CREATE UNIQUE INDEX "Booth_tenantId_boothNumber_key" ON "Booth"("tenantId", "boothNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Village_tenantId_name_key" ON "Village"("tenantId", "name");

-- CreateIndex
CREATE INDEX "Voter_caste_idx" ON "Voter"("caste");
