-- CreateEnum
CREATE TYPE "PacePolicy" AS ENUM ('SHARED', 'OPEN_PACE');

-- AlterTable
ALTER TABLE "recurring_events" ADD COLUMN     "pacePolicy" "PacePolicy";
