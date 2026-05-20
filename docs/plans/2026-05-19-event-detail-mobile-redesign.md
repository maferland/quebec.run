# Event detail page — mobile redesign brief

**Status**: research / design brief, not an implementation plan.
**Origin**: pinpoint annotations #9 and #10 on PR #35 review — "this UI sucks on mobile" both before and after.

## What's broken (observed at 390×844)

1. **Title wraps to 3 lines.** "Faux Mouvement — Mardi" gets squeezed because the calendar icon eats horizontal space at left and `h1` is `text-2xl` bold. Worse for long titles like "6AM Club Saint-Jean-Baptiste".
2. **Address shown twice.** The description includes the address ("70 Bd Champlain, Petit-Champlain, Québec (Café de Course)") and the Meeting Location card below repeats it. Pure duplication.
3. **No map.** Event detail is the one place a user is committing to _show up somewhere_, and there's no visual confirmation of where. We have lat/lng on every recurring event — we're sitting on the data.
4. **Floating "N" marker artifact** appears bottom-left in the empty space below content. Looks like a Leaflet marker leaking from a previous page. Bug.
5. **Empty whitespace below the card** — nothing to do, nowhere to go, no club details, no related events.
6. **No action CTAs.** Can't add to calendar, can't see other events from this club, can't share.
7. **Club tag is decorative.** The "Faux Mouvement" tag links to the club page but doesn't _look_ like a CTA — just a pill.

## Proposed direction (informs an implementation plan, doesn't lock it)

Treat the page as a "are you going?" decision surface. Order content by what a runner needs to decide:

1. **What & when** — title, date, time, distance, pace tags. Drop the calendar icon at left — let the title use full width.
2. **Where** — address ONCE, plus a map (~250px tall on mobile). The address card disappears; the map carries the location.
3. **Who** — club name as a prominent "View {club name} →" link, not a tag.
4. **What next** — three actions in a row: "Add to calendar (.ics)", "Share", "Open in Maps".
5. **More from this club** — list the club's next 3 upcoming events so a runner who missed this one finds the next. Single tap to commit.

## Out of scope

- Event RSVP / "I'm going" tracking — needs user accounts + a new model.
- Comments or social — REFRAME territory, not now.
- Weather, route map (vs. meeting-point map) — nice-to-have, not foundational.

## Bugs to fix regardless of redesign

- Stranded "N" marker bottom-left (Leaflet artifact). Investigate event-map cleanup.
- Title icon swallowing horizontal space on small screens.
- Address duplicate (description vs. Meeting Location card).

## Open questions

- Is the description supposed to _include_ the address, or is that an old data shape we should clean? Look at how recurring events store description vs. address.
- Cancelled events (`EventStatus.CANCELLED`) — how do we surface that on the detail page? Today it's silent.

## Definition of done (when the implementation plan lands)

- Title renders on a single line at ≤25 characters; wraps cleanly above that.
- Map shows for any event with coordinates.
- No duplicate address text.
- "More from this club" section shows 3 upcoming events.
- Three action buttons (ics, share, maps) work and are reachable by thumb on a 390-wide screen.
- No floating artifacts.

## Suggested follow-up sequence

1. Quick PR — fix the obvious bugs (title layout, address dedupe, marker artifact).
2. Design PR — add map + "More from this club" section.
3. Polish PR — action buttons (ics export already in roadmap as Sprint 3.1).
