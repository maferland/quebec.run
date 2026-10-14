-- Kogi runs on Wednesday. Correct the Tuesday schedule introduced by the seed.
UPDATE "recurring_events"
SET "slug" = 'mercredi',
    "schedulePattern" = 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=18;BYMINUTE=15',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "clubId" IN (SELECT "id" FROM "clubs" WHERE "slug" = 'kogi')
  AND "slug" = 'mardi'
  AND "schedulePattern" = 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=15';
