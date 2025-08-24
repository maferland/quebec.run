/*
  Warnings:

  - You are about to drop the column `address` on the `clubs` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `clubs` table. All the data in the column will be lost.
  - You are about to drop the `runs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[stravaClubId]` on the table `clubs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `clubs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."clubs" DROP CONSTRAINT "clubs_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "public"."runs" DROP CONSTRAINT "runs_clubId_fkey";

-- AlterTable
ALTER TABLE "public"."clubs" DROP COLUMN "address",
DROP COLUMN "createdBy",
ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "lastSynced" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "stravaClubId" TEXT,
ADD COLUMN     "stravaSlug" TEXT;

-- DropTable
DROP TABLE "public"."runs";

-- CreateTable
CREATE TABLE "public"."recurring_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "distance" TEXT,
    "pace" TEXT,
    "schedulePattern" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "generateUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clubId" TEXT NOT NULL,

    CONSTRAINT "recurring_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "distance" TEXT,
    "pace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clubId" TEXT NOT NULL,
    "recurringEventId" TEXT,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_stravaClubId_key" ON "public"."clubs"("stravaClubId");

-- AddForeignKey
ALTER TABLE "public"."clubs" ADD CONSTRAINT "clubs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recurring_events" ADD CONSTRAINT "recurring_events_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "public"."clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."events" ADD CONSTRAINT "events_recurringEventId_fkey" FOREIGN KEY ("recurringEventId") REFERENCES "public"."recurring_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
