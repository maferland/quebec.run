# Club schedule audit

Checked October 12–13, 2026. PR #145 preview, commit `8ef745c` before the detail-route repair. No blanket claim that all schedules are correct.

## What was checked

- Preview database: 13 active clubs, 33 active recurring schedules, no concrete events October 12–18.
- Authenticated preview API: all seven days match all 33 stored recurrence weekdays and times. Daily counts: 5, 7, 10, 6, 2, 1, 2.
- Actual local production build using seeded data: all seven lists inspected on desktop and at 390×844. All 33 run rows match between desktop and mobile. All 13 club cards appear.
- Opening a club detail uncovered HTTP 500 locally and in the preview. The dynamic layout conflicted with empty `generateStaticParams` on club/run/place routes. Removed those static fallback generators; production verification recorded below.
- Independent source checks use club websites or official social profiles. quebec.run was not used to corroborate its own claims.

Rendering the stored data correctly does not prove that data is true.

## Seed authority

`prisma/seed.ts` upserts default clubs and recurring schedules when explicitly run. Application pages read PostgreSQL, not the seed file. Admin edits, imports and migrations can change saved records independently. The Vercel build runs migrations and `next build`; it does not run this seed.

The seed previously encoded Kogi as Tuesday. Correcting that to Wednesday required both a seed change and a migration for existing data. It cannot serve as independent proof of a club's actual schedule.

## All clubs

| Club                   | Stored/rendered schedule                                     | Source finding                                                                                                                                                                                                                                 | Verdict                                                                                                |
| ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 6AM Club               | 16 locations, 06:00; location-specific weekdays below        | Official historical directory broadly agrees. Current official app could not expose its schedules in this audit.                                                                                                                               | All 16 currently unverified; historical location/season conflicts below.                               |
| Faux Mouvement         | Tue/Thu 18:00; Sun 09:00; 70 Boulevard Champlain             | [Official contact page](https://fauxmouvement.cc/pages/infolettre) matches regular days/time and café address.                                                                                                                                 | Regular schedule matches; individual destinations/cancellations not guaranteed.                        |
| Gringo's Running Club  | Thu 18:30; location unspecified                              | [Official outings](https://gringosrunningclub.com/entrainements/) confirm Thursday 18:30, with starting point announced weekly.                                                                                                                | Matches; a missing permanent address is intentional.                                                   |
| Les Citrons Pressés    | Mon/Wed 18:30 weekly; description says biweekly              | [Official profile](https://www.instagram.com/citronspressesrunclub/) and [October calendar](https://www.instagram.com/citronspressesrunclub/p/Dd4wQd6glMT/) support weekly October outings at Bambis/Centre Vidéotron.                         | Days/times match; biweekly description is stale. Full post body was login-gated.                       |
| La Panthère            | Wed 17:30; Sat 09:30; Base de plein air Sainte-Foy           | [Official Facebook](https://www.facebook.com/club.la.panthere) confirms normal days/times. Default venue not verified.                                                                                                                         | Partial match; special October 17 event and wrong Instagram handle need attention.                     |
| Volt                   | Mon/Wed 19:00                                                | [Official schedule](https://www.clubdecoursevolt.com/horaire), [FAQ](https://www.clubdecoursevolt.com/faq): Monday 19:00, Wednesday 18:30; Monday venues change seasonally.                                                                    | Wednesday time wrong by 30 minutes; seasonal Monday venue mapping incomplete.                          |
| Club La Foulée         | Tue 18:30 at 2300 rue de la Terrasse; Sun 08:00, no venue    | [Official schedule](https://lafoulee.com/le-club/horaire/): May–Oct Tue 18:00 at Compagnons track, Sun 08:00 rotating points; Nov–Apr Tue 19:00 Centre de glaces, Sun 08:30 Place de la Cité.                                                  | Tuesday time/location wrong; winter time/location handling missing. Page publication date unavailable. |
| Le Coureur Nordique    | Tue 18:15; 141 chemin Sainte-Foy; labelled beginner-friendly | [Official Tuesday group](https://lecoureurnordique.ca/pages/club-de-course-du-mardi-le-coureur-nordique) confirms regular day/time/address, but excludes beginners and pauses several December weeks.                                          | Regular schedule matches; beginner badge contradicts source; exact holiday closures unverified.        |
| Milaprès1000           | Tue 06:30; 986 3e Avenue                                     | Tuesday confirmed by user. [Owner profile](https://comouvement.com/profile/lecafemilagmail-com/) confirms weekly outings in front of Café Mila; [contact page](https://www.lecafemila.ca/contact) confirms address.                            | Weekday user-confirmed; 06:30 independently unverified.                                                |
| Kogi                   | Wed 18:15; 1104 18e Rue                                      | Wednesday confirmed by user. [Official café](https://www.lekogi.com/) / [Instagram](https://www.instagram.com/lekogicafe/) did not provide a retrieved current running timetable.                                                              | Weekday user-confirmed; time/meeting point independently unverified.                                   |
| On court Parlabas      | Mon 18:00 Parc du Brûlé; Tue 06:15, 8 Georges-Muir           | [Official Facebook](https://www.facebook.com/profile.php?id=61558673138284) could not be verified; café website identifies the café only. Secondary directory suggests summer Monday outings at Le Relais.                                     | Unverified. Do not change location from secondary evidence alone.                                      |
| Le Crew Run Club       | Club card, no recurring outings                              | [Official services](https://www.lecrewrunclub.ca/services) identify the club; weekly timetable not retrieved. [October 17 Course & Mocktails](https://www.lecrewrunclub.ca/event-details/course-mocktails) is 12:00–14:00 at 367 rue Soumande. | No verified weekly schedule. Confirmed upcoming one-off missing from preview data.                     |
| Vélo-Course Sainte-Foy | Club card, no recurring outings                              | No matching first-party identity/timetable found. Seed creates it under its test-owner section.                                                                                                                                                | Identity/schedule unverified. Possible demo data, not proof the real club does not exist.              |

## 6AM locations

All depart 06:00 in the seed. [Historical official directory](https://le6amclub.ca/en/pages/nos-communautes-1) snapshots were crawled over a year ago. They are not current confirmation. The site now redirects to [6amclub.run](https://6amclub.run); live browser inspection reached a loading spinner/accessibility control, not schedule content.

| Location              | Stored weekday | Current verification                                                                      |
| --------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| Saint-Sauveur         | Monday         | Unverified; historical match                                                              |
| Shannon               | Monday         | Unverified; historical match                                                              |
| Sillery               | Tuesday        | Unverified; historical match                                                              |
| Beauport              | Tuesday        | Unverified; historical match                                                              |
| Saint-Jean-Baptiste   | Wednesday      | Unverified; historical match                                                              |
| Charlesbourg          | Wednesday      | Unverified; historical match                                                              |
| Lévis / Saint-Romuald | Wednesday      | Unverified; historical match                                                              |
| Lévis / Saint-Nicolas | Wednesday      | Unverified; historical match                                                              |
| Saint-Augustin        | Wednesday      | Unverified; historical unit 260B differs from seed 260                                    |
| Pont-Rouge            | Wednesday      | Unverified; historical match                                                              |
| Maizerets             | Thursday       | Unverified; historical match                                                              |
| Montcalm              | Thursday       | Unverified; historical match                                                              |
| Lévis / Lauzon        | Thursday       | Unverified; no historical location schedule retrieved                                     |
| Neufchâtel            | Thursday       | Unverified; historical match                                                              |
| Limoilou              | Friday         | Unverified; historical April–November season absent from seed                             |
| Lac-Beauport          | Friday         | Unverified; historical 99 chemin du Tour-du-Lac conflicts with seed 1020 boulevard du Lac |

## Dated exceptions and other omissions

- [La Panthère Run & Pizza](https://www.facebook.com/club.la.panthere/posts/pfbid02fXdnT1F6djR55qH8PtbSuU8eFMpSXiC574USe75KnF9Nd98auKqdTpkCJy2Nr5sMl): October 17, arrival 10:30, departure 10:45, 1201 3e Avenue. Whether this replaces the usual 09:30 outing is not explicit; do not assume both or overwrite the weekly schedule blindly.
- La Panthère's [official Linktree](https://linktr.ee/clublapanthere) links Instagram `club.la.panthere`; seed stores `clublapanthere`.
- Crew's October 17 event has no saved concrete record in the audited preview week.
- Nordique also publishes [Thursday trail outings May–September](https://lecoureurnordique.ca/pages/calendrier-club-de-trail). Their absence is a seasonal coverage gap, not evidence of a missing October outing.

## Guardrails

Existing regression tests cover date-keyed week caching, midnight/DST rollover, fresh past-state flags and deployment cache identity. The Kogi migration test preserves history and unrelated clubs. CI now builds the production app before desktop/mobile E2E tests and starts that build, so existing HTML/HTTP route assertions can catch production-only static-generation failures. These checks prevent rendering/date-handling regressions; they do not fact-check club schedules.

For factual reliability, each maintained schedule needs a source URL and last-checked date, explicit seasonal boundaries, and dated overrides/cancellations. Start with the verified conflicts above. Resolve uncertain meeting points and whether special events replace normal outings before writing data. A seed snapshot or passing test cannot replace this review.

## Production-build verification

Repair build passed. All 13 club detail headings rendered on the mobile production build after restarting the server. All 16 6AM schedule entries expanded successfully. Tuesday/Wednesday Kogi run page HTTP checks passed. All 1,078 unit/integration tests passed, including existing cache and migration regressions. All three production HTTP panel tests passed (club, run, place). Deployment checks recorded in the PR.

Audit source findings remain open; this report does not certify all club data as correct. The verified corrections below are included in the PR; uncertain and seasonal schedules remain open.

## Verified corrections applied October 13

- Volt Wednesday corrected from 19:00 to 18:30; matching club description corrected.
- Citrons biweekly description removed; weekly recurrence unchanged.
- La Panthère Instagram corrected to `club.la.panthere`.
- Coureur Nordique beginner badge removed.
- Crew October 17 Course & Mocktails added as one dated event at 12:00, not a weekly recurrence. Existing organizer-entered events that day are preserved.
- Seed no longer invents a rolling future Kogi beer outing to demonstrate the interface. Existing saved events are not deleted.

Guarded migrations preserve unrelated records, changed values and event history. Regression tests cover the migration and day/time rendering, including Crew appearing only on the announced Saturday.

La Foulée's seasonal corrections and Volt Monday venue seasons remain unresolved. The runtime understands RRULE month restrictions, but the recurrence editor currently drops them. Adding restricted recurrences now would silently lose seasons after an edit. No fixed year-round substitute was invented. Dated Panthère exception replacement, December closures and current 6AM schedules remain unverified.
