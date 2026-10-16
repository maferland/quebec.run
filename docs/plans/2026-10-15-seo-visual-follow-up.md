# Map tiles follow-up

During desktop (1440 × 1000) and mobile (390 × 844) verification of the SEO
changes, the local map displayed CARTO tiles labelled “API key required” instead
of a street map. Markers, listing cards, and detail navigation still worked.

This is outside the card-link and homepage-copy change. Investigate the current
tile provider's authentication requirements and reproduce on production before
choosing a fix. Verify the resulting map on desktop and mobile, including
attribution and any credential exposure. Do not substitute a provider without
checking its usage terms and cost.

SEO validation: server-rendered French and English listing pages each contain
one H1 and real detail links before hydration. Club and run links retain the
existing detail-panel interaction. All 1,089 tests, lint, and TypeScript passed;
statement/line coverage was 58.64%, below the 95% requirement in AGENTS.md.
