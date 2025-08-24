/*
  Migration: Add slugs to existing clubs
  
  This migration:
  1. Adds slug column as nullable
  2. Populates slugs for existing clubs based on their names
  3. Makes slug required and unique
*/

-- Step 1: Add slug column as nullable
ALTER TABLE "public"."clubs" ADD COLUMN "slug" TEXT;

-- Step 2: Update existing clubs with slugs generated from their names
-- This generates slugs like: "6AM Club" -> "6am-club", "Club Québec" -> "club-quebec"
UPDATE "public"."clubs" 
SET "slug" = 
  CASE 
    WHEN "name" ILIKE '%6AM Club%' THEN '6am-club'
    ELSE LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(TRIM("name"), '[àáâãäå]', 'a', 'g'),
          '[èéêë]', 'e', 'g'
        ),
        '[^a-z0-9]+', '-', 'g'
      )
    )
  END
WHERE "slug" IS NULL;

-- Step 3: Handle potential duplicates by appending numbers
WITH duplicate_slugs AS (
  SELECT "slug", ROW_NUMBER() OVER (PARTITION BY "slug" ORDER BY "createdAt") as rn
  FROM "public"."clubs" 
  WHERE "slug" IS NOT NULL
)
UPDATE "public"."clubs" 
SET "slug" = "clubs"."slug" || '-' || duplicate_slugs.rn
FROM duplicate_slugs 
WHERE "clubs"."slug" = duplicate_slugs."slug" 
  AND duplicate_slugs.rn > 1;

-- Step 4: Make slug required and add unique constraint
ALTER TABLE "public"."clubs" ALTER COLUMN "slug" SET NOT NULL;

-- Step 5: Create unique index
CREATE UNIQUE INDEX "clubs_slug_key" ON "public"."clubs"("slug");
