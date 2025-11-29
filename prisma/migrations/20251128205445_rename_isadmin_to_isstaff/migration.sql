-- AlterTable
-- Rename isAdmin column to isStaff to preserve existing data
ALTER TABLE "public"."users" RENAME COLUMN "isAdmin" TO "isStaff";
