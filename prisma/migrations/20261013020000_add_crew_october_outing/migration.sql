-- Official dated outing, not a weekly recurrence. Checked 2026-10-13:
-- https://www.lecrewrunclub.ca/event-details/course-mocktails
INSERT INTO "events" (
  "id", "slug", "title", "description", "address", "placeName",
  "date", "time", "clubId", "createdAt", "updatedAt"
)
SELECT 'crew-course-mocktails-20261017', 'crew-course-mocktails-2026-10-17',
       'Course & Mocktails',
       'Sortie gratuite, de 12h à 14h. Inscription : https://www.lecrewrunclub.ca/event-details/course-mocktails',
       '367 Rue Soumande, Québec, QC G1M 1A5', 'Centre d’entraînement Le Crew',
       TIMESTAMP '2026-10-17 16:00:00', '12:00', "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "clubs"
WHERE "slug" = 'le-crew-run-club'
  AND NOT EXISTS (
    SELECT 1 FROM "events"
    WHERE "slug" = 'crew-course-mocktails-2026-10-17'
       OR ("clubId" = "clubs"."id"
           AND "date" >= TIMESTAMP '2026-10-17 04:00:00'
           AND "date" < TIMESTAMP '2026-10-18 04:00:00'
           AND "recurringEventId" IS NULL)
  );
