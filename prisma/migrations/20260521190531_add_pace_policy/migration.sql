-- CreateEnum
CREATE TYPE "PacePolicy" AS ENUM ('SHARED', 'INCLUSIVE');

-- AlterTable
ALTER TABLE "recurring_events" ADD COLUMN     "pacePolicy" "PacePolicy";
