-- DropForeignKey
ALTER TABLE "public"."clubs" DROP CONSTRAINT "clubs_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "public"."clubs" ADD CONSTRAINT "clubs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
