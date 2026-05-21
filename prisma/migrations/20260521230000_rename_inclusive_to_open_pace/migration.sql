-- The PR's first migration was edited mid-flight from creating the enum with
-- 'INCLUSIVE' to creating it with 'OPEN_PACE'. Prod databases that ran the
-- earlier version of the migration have 'INCLUSIVE' in their enum and the
-- new client errors when reading or writing pacePolicy. This idempotent
-- rename aligns any such DBs without disturbing fresh ones.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'PacePolicy' AND e.enumlabel = 'INCLUSIVE'
  ) THEN
    ALTER TYPE "PacePolicy" RENAME VALUE 'INCLUSIVE' TO 'OPEN_PACE';
  END IF;
END $$;
