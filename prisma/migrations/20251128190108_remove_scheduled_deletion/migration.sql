/*
  Warnings:

  - You are about to drop the `data_deletion_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."data_deletion_requests" DROP CONSTRAINT "data_deletion_requests_userId_fkey";

-- DropTable
DROP TABLE "public"."data_deletion_requests";
