# Event metadata — content / data model follow-ups

**Status**: brief, not an implementation plan.
**Origin**: pinpoint v10 review of the event-detail redesign. Two questions came back that aren't pixel bugs — they're product/data questions worth capturing before they're forgotten.

## Questions raised

### 1. Accessibility / beginner-friendliness signal

> "Do we have an example of this for accessible trainings?"

The detail page can show distance + pace, but nothing telegraphs whether a run welcomes beginners, has a no-drop policy, or runs a specific perceived-effort scale. Today only `paceMin`/`paceMax` and `beginnerFriendly` (boolean) exist on `Club`, not on `RecurringEvent`. So an "accessible Friday tempo" can't be marked as such.

**Possible directions**:

- Promote `beginnerFriendly` to RecurringEvent.
- Add a small enum `pacePolicy: 'no-drop' | 'split-groups' | 'self-paced' | 'fast-only'`.
- Add a "perceived effort" scale (1–5 or RPE 1–10) as a more accessible alternative to numeric pace.

### 2. Route topology: loop vs out-and-back vs point-to-point

> "Should this show when a club is a loop versus when it just stops?"

The address is the meeting point. The runner doesn't know whether they finish back there (loop) or at a different point (point-to-point), which matters for car/transit planning. Today the schema has only one address field.

**Possible directions**:

- Add `routeTopology: 'loop' | 'out-and-back' | 'point-to-point'`.
- For point-to-point, optionally add `endAddress`.
- Could surface via a small badge ("Boucle 8 km" / "Aller-retour 8 km" / "Point à point").

## Out of scope for the next PR

- These are data-model + UX additions. Each is a small feature with schema migration + seed updates + UI surface.
- Pick one to land first; the other can follow.

## Suggested sequence

1. Brief schema design — what fields land on RecurringEvent vs Event vs Club.
2. Migration + seed updates for a couple of clubs to validate.
3. UI surface on event detail (small badges near distance/pace).
4. Surface on club detail recurring-pattern cards.
