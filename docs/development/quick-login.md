# Dev Quick Login

## Overview

In development mode, a quick login bypass is available on the signin page to skip email verification.

## Usage

1. Navigate to `/auth/signin`
2. Look for the yellow "DEV ONLY - Quick Login" box
3. Select a test account from the dropdown:
   - **Marc-Antoine Ferland** (maferland@quebec.run) - Platform Staff
   - **Alice Tremblay** (alice.tremblay@quebec.run) - Club Owner
   - **Bob Gagnon** (bob.gagnon@quebec.run) - Club Owner
4. Click "Sign in instantly"
5. You're signed in without email verification

## Security

This feature is **completely disabled in production** via environment checks:

- Only works when `NODE_ENV !== 'production'`
- Uses NextAuth CredentialsProvider with explicit dev-only guards
- UI only renders in development
- Provider not added to auth config in production

## Testing Different Users

Use quick login to test:

- Staff permissions (Marc-Antoine)
- Club owner permissions (Alice, Bob)
- Staff promotion UI (promote Alice or Bob to staff)

## Technical Details

**Implementation:**

- `src/lib/auth.ts` - CredentialsProvider with env check
- `src/app/[locale]/auth/signin/page.tsx` - Dev-only UI
- Provider looks up user by email, returns session

**Tests:**

- `src/lib/auth.test.ts` - Provider inclusion tests
- `src/app/[locale]/auth/signin/page.test.tsx` - UI visibility tests
