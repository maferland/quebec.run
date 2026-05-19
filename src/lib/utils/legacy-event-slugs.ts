/**
 * Maps the pre-migration global slugs of recurring events to their new
 * per-club (clubSlug, eventSlug) shape so the legacy /events/<slug>--<date>
 * URLs can still resolve to a 301 redirect after the per-club rename.
 *
 * Only the existing dataset is covered. Any new event seeded post-migration
 * is created directly with the new slug — no legacy entry needed.
 */
export const LEGACY_VIRTUAL_SLUG_MAP: Record<
  string,
  { clubSlug: string; eventSlug: string }
> = {
  // 6AM Club (16 locations)
  '6am-club-beauport': { clubSlug: '6am-club', eventSlug: 'beauport' },
  '6am-club-charlesbourg': { clubSlug: '6am-club', eventSlug: 'charlesbourg' },
  '6am-club-lac-beauport': { clubSlug: '6am-club', eventSlug: 'lac-beauport' },
  '6am-club-levis-lauzon': { clubSlug: '6am-club', eventSlug: 'levis-lauzon' },
  '6am-club-levis-st-nicolas': {
    clubSlug: '6am-club',
    eventSlug: 'levis-st-nicolas',
  },
  '6am-club-levis-st-romuald': {
    clubSlug: '6am-club',
    eventSlug: 'levis-st-romuald',
  },
  '6am-club-limoilou': { clubSlug: '6am-club', eventSlug: 'limoilou' },
  '6am-club-maizerets': { clubSlug: '6am-club', eventSlug: 'maizerets' },
  '6am-club-montcalm': { clubSlug: '6am-club', eventSlug: 'montcalm' },
  '6am-club-neufchatel': { clubSlug: '6am-club', eventSlug: 'neufchatel' },
  '6am-club-pont-rouge': { clubSlug: '6am-club', eventSlug: 'pont-rouge' },
  '6am-club-saint-augustin': {
    clubSlug: '6am-club',
    eventSlug: 'saint-augustin',
  },
  '6am-club-saint-jean-baptiste': {
    clubSlug: '6am-club',
    eventSlug: 'saint-jean-baptiste',
  },
  '6am-club-saint-sauveur': {
    clubSlug: '6am-club',
    eventSlug: 'saint-sauveur',
  },
  '6am-club-shannon': { clubSlug: '6am-club', eventSlug: 'shannon' },
  '6am-club-sillery': { clubSlug: '6am-club', eventSlug: 'sillery' },

  // Faux Mouvement (club slug is one word, event slugs were hyphenated)
  'faux-mouvement-mardi': { clubSlug: 'fauxmouvement', eventSlug: 'mardi' },
  'faux-mouvement-jeudi': { clubSlug: 'fauxmouvement', eventSlug: 'jeudi' },
  'faux-mouvement-dimanche': {
    clubSlug: 'fauxmouvement',
    eventSlug: 'dimanche',
  },

  // Les Citrons Pressés
  'les-citrons-presses-lundi': {
    clubSlug: 'les-citrons-presses',
    eventSlug: 'lundi',
  },
  'les-citrons-presses-mercredi': {
    clubSlug: 'les-citrons-presses',
    eventSlug: 'mercredi',
  },

  // La Panthère
  'la-panthere-mercredi': { clubSlug: 'la-panthere', eventSlug: 'mercredi' },
  'la-panthere-samedi': { clubSlug: 'la-panthere', eventSlug: 'samedi' },

  // Volt
  'volt-lundi': { clubSlug: 'volt', eventSlug: 'lundi' },
  'volt-mercredi': { clubSlug: 'volt', eventSlug: 'mercredi' },

  // Single-occurrence clubs whose old slug equalled the club slug
  'le-coureur-nordique': {
    clubSlug: 'le-coureur-nordique',
    eventSlug: 'mardi',
  },
  milapres1000: { clubSlug: 'milapres1000', eventSlug: 'mardi' },
  'kogi-mardi': { clubSlug: 'kogi', eventSlug: 'mardi' },

  // Club La Foulée — kept workout-type qualifier
  'club-la-foulee-intervalles': {
    clubSlug: 'club-la-foulee',
    eventSlug: 'intervalles-mardi',
  },
  'club-la-foulee-longue-sortie': {
    clubSlug: 'club-la-foulee',
    eventSlug: 'longue-sortie-dimanche',
  },
}
