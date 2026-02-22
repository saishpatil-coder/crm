/*
  Warnings:

  - You are about to drop the column `addressLine1` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `addressLine2` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `boothId` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `isInfluencer` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `isStarVoter` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `supportStatus` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `voterIdNumber` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the `Booth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserBoothAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Village` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `epicNumber` to the `Voter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Voter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Voter` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Booth" DROP CONSTRAINT "Booth_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Booth" DROP CONSTRAINT "Booth_villageId_fkey";

-- DropForeignKey
ALTER TABLE "UserBoothAssignment" DROP CONSTRAINT "UserBoothAssignment_boothId_fkey";

-- DropForeignKey
ALTER TABLE "UserBoothAssignment" DROP CONSTRAINT "UserBoothAssignment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "UserBoothAssignment" DROP CONSTRAINT "UserBoothAssignment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Village" DROP CONSTRAINT "Village_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Voter" DROP CONSTRAINT "Voter_boothId_fkey";

-- DropIndex
DROP INDEX "Voter_boothId_idx";

-- DropIndex
DROP INDEX "Voter_caste_idx";

-- DropIndex
DROP INDEX "Voter_hasVoted_idx";

-- DropIndex
DROP INDEX "Voter_isStarVoter_idx";

-- DropIndex
DROP INDEX "Voter_supportStatus_idx";

-- DropIndex
DROP INDEX "Voter_tenantId_idx";

-- DropIndex
DROP INDEX "Voter_tenantId_voterIdNumber_key";

-- AlterTable
ALTER TABLE "Voter" DROP COLUMN "addressLine1",
DROP COLUMN "addressLine2",
DROP COLUMN "boothId",
DROP COLUMN "isDeleted",
DROP COLUMN "isInfluencer",
DROP COLUMN "isStarVoter",
DROP COLUMN "name",
DROP COLUMN "supportStatus",
DROP COLUMN "voterIdNumber",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "asmConstituency" TEXT,
ADD COLUMN     "cityVillage" TEXT,
ADD COLUMN     "epicNumber" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "gramPanchayat" TEXT,
ADD COLUMN     "isVisited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "otherInfo" TEXT,
ADD COLUMN     "parlConstituency" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "pollingStation" TEXT,
ADD COLUMN     "serialNumber" INTEGER,
ADD COLUMN     "supportLevel" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "ward" TEXT;

-- DropTable
DROP TABLE "Booth";

-- DropTable
DROP TABLE "UserBoothAssignment";

-- DropTable
DROP TABLE "Village";

-- CreateIndex
CREATE INDEX "Voter_tenantId_pollingStation_idx" ON "Voter"("tenantId", "pollingStation");

-- CreateIndex
CREATE INDEX "Voter_tenantId_ward_idx" ON "Voter"("tenantId", "ward");
