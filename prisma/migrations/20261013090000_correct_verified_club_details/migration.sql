-- Correct only the exact seeded values; preserve organizer edits and event history.
DO $$
BEGIN
  UPDATE "recurring_events"
  SET "schedulePattern" = 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=18;BYMINUTE=30',
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "clubId" IN (SELECT "id" FROM "clubs" WHERE "slug" = 'volt')
    AND "slug" = 'mercredi'
    AND "schedulePattern" = 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=19;BYMINUTE=0';

  UPDATE "clubs"
  SET "description" = 'Club de course structuré — entraînements lundi 19h et mercredi 18h30.',
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "slug" = 'volt'
    AND "description" = 'Club de course structuré — entraînements lundi et mercredi 19h. 260$/an ou 90$/trimestre.';

  UPDATE "clubs"
  SET "description" = 'Club de course social — 5km ou 10km (~6:00/km). Lundi et mercredi.',
      "updatedAt" = CURRENT_TIMESTAMP
  WHERE "slug" = 'les-citrons-presses'
    AND "description" = 'Club de course social — 5km ou 10km (~6:00/km). Lundi et mercredi aux 2 semaines.';

  UPDATE "clubs"
  SET "instagram" = 'club.la.panthere', "updatedAt" = CURRENT_TIMESTAMP
  WHERE "slug" = 'la-panthere' AND "instagram" = 'clublapanthere';

  UPDATE "clubs"
  SET "beginnerFriendly" = false, "updatedAt" = CURRENT_TIMESTAMP
  WHERE "slug" = 'le-coureur-nordique' AND "beginnerFriendly" = true;
END $$;
