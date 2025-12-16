-- CreateEnum
CREATE TYPE "ClubType" AS ENUM ('TRAIL', 'ROAD', 'TRACK', 'MIXED');

-- CreateEnum
CREATE TYPE "ClubVibe" AS ENUM ('SOCIAL', 'TRAINING', 'COMPETITIVE');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'CANCELLED');

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "beginnerFriendly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "paceMax" TEXT,
ADD COLUMN     "paceMin" TEXT,
ADD COLUMN     "type" "ClubType",
ADD COLUMN     "vibe" "ClubVibe",
ADD COLUMN     "welcomeInfo" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
ALTER COLUMN "clubId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "stravaClubId" TEXT,
    "stravaSlug" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "clubId" TEXT,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_stravaClubId_key" ON "organizations"("stravaClubId");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration: Create Organization for each existing Club
-- Note: Strava fields stay on Club (Organization.strava is for event-only orgs)
INSERT INTO "organizations" ("id", "name", "slug", "description", "website", "instagram", "facebook", "isVisible", "createdAt", "updatedAt", "ownerId")
SELECT
  'org_' || "id",           -- Generate org ID from club ID
  "name",
  "slug" || '-org',         -- Temporary unique slug
  "description",
  "website",
  "instagram",
  "facebook",
  false,                    -- isVisible = false (hidden org for simple clubs)
  "createdAt",
  "updatedAt",
  "ownerId"
FROM "clubs";

-- Link existing Clubs to their auto-created Organizations
UPDATE "clubs" SET "organizationId" = 'org_' || "id";
