-- Drop the global uniqueness on slug; uniqueness becomes scoped to (clubId, slug)
DROP INDEX "recurring_events_slug_key";

-- Strip club slug prefix from event slugs so URLs can be /clubs/{club}/events/{slug}.
-- Explicit per-row updates keep the change reviewable and idempotent — if a slug
-- is already in the new shape, the matching WHERE clause finds nothing and the
-- statement is a no-op.

-- 6AM Club (16 locations)
UPDATE "recurring_events" SET "slug" = 'beauport' WHERE "slug" = '6am-club-beauport';
UPDATE "recurring_events" SET "slug" = 'charlesbourg' WHERE "slug" = '6am-club-charlesbourg';
UPDATE "recurring_events" SET "slug" = 'lac-beauport' WHERE "slug" = '6am-club-lac-beauport';
UPDATE "recurring_events" SET "slug" = 'levis-lauzon' WHERE "slug" = '6am-club-levis-lauzon';
UPDATE "recurring_events" SET "slug" = 'levis-st-nicolas' WHERE "slug" = '6am-club-levis-st-nicolas';
UPDATE "recurring_events" SET "slug" = 'levis-st-romuald' WHERE "slug" = '6am-club-levis-st-romuald';
UPDATE "recurring_events" SET "slug" = 'limoilou' WHERE "slug" = '6am-club-limoilou';
UPDATE "recurring_events" SET "slug" = 'maizerets' WHERE "slug" = '6am-club-maizerets';
UPDATE "recurring_events" SET "slug" = 'montcalm' WHERE "slug" = '6am-club-montcalm';
UPDATE "recurring_events" SET "slug" = 'neufchatel' WHERE "slug" = '6am-club-neufchatel';
UPDATE "recurring_events" SET "slug" = 'pont-rouge' WHERE "slug" = '6am-club-pont-rouge';
UPDATE "recurring_events" SET "slug" = 'saint-augustin' WHERE "slug" = '6am-club-saint-augustin';
UPDATE "recurring_events" SET "slug" = 'saint-jean-baptiste' WHERE "slug" = '6am-club-saint-jean-baptiste';
UPDATE "recurring_events" SET "slug" = 'saint-sauveur' WHERE "slug" = '6am-club-saint-sauveur';
UPDATE "recurring_events" SET "slug" = 'shannon' WHERE "slug" = '6am-club-shannon';
UPDATE "recurring_events" SET "slug" = 'sillery' WHERE "slug" = '6am-club-sillery';

-- Faux Mouvement (3 weekly slots) — club slug is fauxmouvement but event slugs were hyphenated
UPDATE "recurring_events" SET "slug" = 'mardi' WHERE "slug" = 'faux-mouvement-mardi';
UPDATE "recurring_events" SET "slug" = 'jeudi' WHERE "slug" = 'faux-mouvement-jeudi';
UPDATE "recurring_events" SET "slug" = 'dimanche' WHERE "slug" = 'faux-mouvement-dimanche';

-- Les Citrons Pressés
UPDATE "recurring_events" SET "slug" = 'lundi' WHERE "slug" = 'les-citrons-presses-lundi';
UPDATE "recurring_events" SET "slug" = 'mercredi' WHERE "slug" = 'les-citrons-presses-mercredi';

-- La Panthère
UPDATE "recurring_events" SET "slug" = 'mercredi' WHERE "slug" = 'la-panthere-mercredi';
UPDATE "recurring_events" SET "slug" = 'samedi' WHERE "slug" = 'la-panthere-samedi';

-- Volt
UPDATE "recurring_events" SET "slug" = 'lundi' WHERE "slug" = 'volt-lundi';
UPDATE "recurring_events" SET "slug" = 'mercredi' WHERE "slug" = 'volt-mercredi';

-- Single-event clubs whose slug equalled the club slug
UPDATE "recurring_events" SET "slug" = 'mardi' WHERE "slug" = 'le-coureur-nordique';
UPDATE "recurring_events" SET "slug" = 'mardi' WHERE "slug" = 'milapres1000';

-- Club La Foulée — keep workout-type qualifier (clearer than bare day)
UPDATE "recurring_events" SET "slug" = 'intervalles-mardi' WHERE "slug" = 'club-la-foulee-intervalles';
UPDATE "recurring_events" SET "slug" = 'longue-sortie-dimanche' WHERE "slug" = 'club-la-foulee-longue-sortie';

-- Add the new per-club uniqueness constraint
CREATE UNIQUE INDEX "recurring_events_clubId_slug_key" ON "recurring_events"("clubId", "slug");
