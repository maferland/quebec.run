# Footer-level auth + admin link

**Status**: brief, not an implementation plan.
**Origin**: pinpoint v0 on mobile-nav redesign — "idk if we need to surface this [Connexion in the drawer], maybe there should just be an admin link in the footer (for later)".

## What's the question

Today the mobile drawer surfaces Connexion (and Déconnexion / user info when authed) as a prominent block. That makes auth feel core, which it isn't yet — the platform is read-only for unauth'd users, and there's no real reason to push them to sign in from a primary nav surface.

## Possible direction

- Drop the auth section from the mobile drawer.
- Move "Sign in / Account" + "Admin" (when staff) into the page footer as small text links.
- Keeps the drawer focused on **navigation between content sections**, not session management.

## Out of scope for now

- Doesn't change the desktop nav (auth still lives top-right there).
- Doesn't affect the auth flow itself.

## Things to consider before doing this

- Does the platform need a visible "Sign in" prompt for converting first-time visitors? If yes, keep it prominent. If no, footer is fine.
- Is staff-only `/admin` ever entered from mobile? If basically never, footer makes sense.

## When to do this

Wait until we have a story for what authed users actually get (RSVPs, saved events, comments, etc.). At that point, deciding where the auth surface lives is data-informed, not aesthetic.
