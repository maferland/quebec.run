-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "manualOverrides" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "lastSyncStatus" TEXT,
ADD COLUMN     "lastSyncError" TEXT,
ADD COLUMN     "lastSyncAttempt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "stravaEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "events_stravaEventId_key" ON "events"("stravaEventId");
