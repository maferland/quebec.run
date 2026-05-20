# Club detail: collapse virtual occurrences to one card per pattern

**Status**: design brief, awaiting prioritization.
**Origin**: pinpoint review on PR #37 (annotation #3) — "why do we show so many virtual items?". This was flagged twice across two reviews.

## What's wrong today

Club La Foulée has 2 recurring patterns (Intervalles Tue 18:30, Longue sortie Sun 8:00). The club detail page shows **9 upcoming event cards** — the same two patterns × 4–5 occurrences over the next 30 days. A visitor to the club's page already knows the schedule; the cards just repeat themselves.

## Proposed direction

Treat the club detail events list as a **schedule view**, not an occurrence stream. One card per recurring pattern:

- **Title**: event title (`Intervalles`)
- **Schedule summary**: humanized rrule — "Every Tuesday at 18:30". Computed once from `schedulePattern`.
- **Next date** as a small badge — "Next: Tue May 19".
- **Location** stays the same.
- Optional: tap to expand for the next 4 dates if a visitor wants to plan ahead.

Cross-club timelines (`/events`, `/calendar`, homepage map) keep occurrences — they're answering "what's happening Wednesday at 6PM", which needs one row per occurrence.

## Empty card secondary issue (same pinpoint annotation)

Event cards render a blank middle when the event has no description and no distance/pace. Cause: `EventCard` fixes a height for the location section but leaves the gap above empty when the optional fields are missing.

Two paths:

1. Pull `description` from the recurring event into the card (small, ships immediately).
2. Collapse to "schedule view" per the section above — the empty space goes away because the card is intentionally shorter.

Doing #2 makes #1 unnecessary on the club detail surface. On cross-club timelines (`/events`), keep an eye on whether `#1` helps there too.

## Implementation sketch

1. **rrule → human helper** in `src/lib/utils/rrule-builder.ts` (already has builders; add a `describePattern(rrule, locale)` that returns "Every Tuesday at 18:30" / "Tous les mardis à 18 h 30").
2. **New `RecurringEventCard`** component in `src/components/clubs/` (or reuse `EventCard` with a `mode="pattern"` prop — judgment call when implementing).
3. **`getClubBySlug`** stops calling `getEventsInRange`; switches to returning the club's recurring patterns directly, each with a precomputed `nextOccurrence` date. One query for the club, the patterns are already related.
4. **Club detail page** swaps `<ClubEventsList>` for the new pattern list.
5. Tests: one component test + one integration test verifying the club detail page shows one card per pattern.

## Out of scope

- Changing `/events` and `/calendar` (occurrence-oriented stays).
- Admin views of recurring events.
- Pattern-level RSVP / "I attend every week".

## Risks

- `describePattern` for arbitrary rrules can get gnarly fast. Limit to weekly patterns for v1 — anything more complex falls back to the raw schedulePattern string. We don't have non-weekly patterns today.
- "Next occurrence" needs to update — if today is past the pattern's hour, the next card should still say "today" not "tomorrow". Use the existing `expandRRuleDates` + a small clock-anchored fixture in tests.

## Definition of done

- Club La Foulée page shows 2 cards (Intervalles, Longue sortie), each with the schedule summary + next date.
- 6AM Club page shows 16 cards (one per location), each with its single weekly pattern summarized.
- `/events` and `/calendar` unchanged.
- Coverage holds; e2e covers "club page renders one card per pattern".
