# Component abstraction & design system pass

**Status**: brief, not an implementation plan.
**Origin**: noticed during event-detail bug fixes (May 2026). Page-level files like `src/app/[locale]/clubs/[slug]/page.tsx` and the event detail page carry long inline `className` chains (10+ utilities per element, repeated across files). Same pattern across most page components.

## What's bothering me

1. **Tailwind className soup at page level.** Page components mix data fetching, layout, and visual styling. A typical block:

   ```tsx
   <div className="flex items-start gap-3 md:gap-4 mb-6">
     <div className="p-2 md:p-3 bg-primary/10 rounded-xl">
       <Icon icon={Users} size="md" color="primary" decorative />
     </div>
     <div className="flex-1">
       <h1 className="text-2xl md:text-4xl font-heading font-bold text-primary mb-2">
   ```

   The semantic intent ("club hero with icon + heading") is buried in utility classes.

2. **Patterns repeated without a name.** Hero cards, section headers (`Icon + h2`), social-link pills, event date+time rows — each rebuilt inline on multiple pages. When we want to tighten padding or shift typography, we touch N files.

3. **Inconsistency creeps in.** Pattern collapse rounds 1–7 had to manually align padding/colors across club detail, event detail, list cards. A few cycles still had drift caught only by pinpoint.

4. **Page-level files do too much.** Data fetching + composition + presentation. Hard to read the page's structure at a glance.

## What an improvement pass could look like

- **Extract a small page-section vocabulary**:
  - `PageHeroCard` (gradient bg + icon slot + title + meta row + body slot)
  - `SectionHeader` (Icon + h2 with color/size variants)
  - `BackLink` (already half-built — used inconsistently)
  - `SocialTagLink` (the pattern I copied across club detail)
  - `MetaTagRow` (date+time+distance+pace combo)
- **Move semantic-level CSS into the design system layer** (Tag/Card variants) so page-level files stop redefining the same shape.
- **Page files become composition**: `<PageHeroCard icon={Users} title={...} meta={...}>{description}</PageHeroCard>`.

## Out of scope

- Wholesale rewrite of the design system. We have working primitives (Tag, Card, Icon, Link). The gap is mid-level compositions.
- Renaming Tailwind tokens. Brand colors and spacing scale are fine as-is.

## Risks

- Premature abstraction: extracting too eagerly leads to props bloat. Only extract a component when it has 2+ usages with the same intent.
- Test churn: extracted components need their own stories + tests; bumping coverage threshold work.

## Open questions

- Do we want a "blocks" layer (between primitives and pages) or just keep extracting one-off page components? A blocks layer is more disciplined; ad-hoc extraction is faster.
- Should this be one big PR or N small ones (one per extracted component)? Small PRs are easier to review but slower overall. Probably small.

## Suggested sequence (when this lands)

1. Audit: list the top-5 inline patterns by usage count across pages.
2. Pick the most repeated pattern (likely `PageHeroCard` or the social link pill).
3. Extract → migrate one page → pinpoint diff → ship.
4. Repeat for next pattern. Don't batch.

## Definition of done

- Top-level page files (clubs, events, calendar) are < 80 lines of JSX excluding imports.
- No single inline `className` chain exceeds ~5 utilities.
- Storybook has stories for each new mid-level component.
- Pinpoint diff between before/after shows no visual regression.
