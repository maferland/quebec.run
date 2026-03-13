-- AlterTable: add slug column (nullable first for existing rows)
ALTER TABLE "recurring_events" ADD COLUMN "slug" TEXT;

-- Backfill: generate slugs from title using lower + replace spaces/special chars
UPDATE "recurring_events"
SET "slug" = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        title,
        'é', 'e'), 'è', 'e'), 'ê', 'e'), 'â', 'a'), 'î', 'i'
      ),
      '[^a-z0-9\-]', '-', 'g'
    ),
    '-+', '-', 'g'
  )
);

-- Remove trailing hyphens
UPDATE "recurring_events"
SET "slug" = REGEXP_REPLACE("slug", '^-|-$', '', 'g');

-- Make column required and unique
ALTER TABLE "recurring_events" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "recurring_events_slug_key" ON "recurring_events"("slug");
