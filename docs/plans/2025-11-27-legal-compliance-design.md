# Legal Compliance Design

**Date:** 2025-11-27
**Status:** Approved
**Approach:** Law 25 compliant with simplified consent model

## Overview

Implement Terms of Service, Privacy Policy, and data management features to comply with Quebec Law 25 requirements before launch. Design prioritizes simplicity: one-time consent via continued usage, bilingual static legal pages, and user data rights (export/deletion).

## Context

quebec.run collects personal data (email, name, photos, location data via events) and requires legal compliance for Quebec jurisdiction. Currently in development with no existing legal documentation.

**Key compliance needs:**
- Law 25 (Quebec privacy law)
- Right to data export
- Right to deletion with grace period
- Audit trail for consent
- Bilingual (fr/en) legal documents

## Architecture

### Consent Model

**Simplified approach:** Usage of platform = acceptance of terms. No blocking middleware or version tracking.

- First-time authenticated users see consent banner
- Single acceptance per user (stored in `UserConsent`)
- Updates to TOS: notify users, continued use = acceptance
- No forced re-consent or access blocking

### Database Schema

Add two new models to `schema.prisma`:

```prisma
model UserConsent {
  id          String   @id @default(cuid())
  userId      String   @unique
  acceptedAt  DateTime @default(now())
  ipAddress   String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_consents")
}

model DataDeletionRequest {
  id           String   @id @default(cuid())
  userId       String
  requestedAt  DateTime @default(now())
  scheduledFor DateTime // 30 days from request
  status       String   @default("pending") // pending, completed, cancelled

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("data_deletion_requests")
}
```

Update `User` model with relations:
```prisma
consents UserConsent[]
deletionRequests DataDeletionRequest[]
```

## Components

### 1. Legal Pages

**Routes:**
- `/[locale]/legal/terms` - Terms of Service
- `/[locale]/legal/privacy` - Privacy Policy

**Content:**
- Static pages with markdown/HTML content
- Bilingual via next-intl
- Include standard clauses:
  - Data collection and usage
  - User responsibilities
  - Quebec jurisdiction
  - Contact information
  - Right to update terms (continued use = acceptance)

### 2. Consent Banner (`ConsentBanner.tsx`)

**Behavior:**
- Fixed bottom banner (dismissible)
- Shows for authenticated users without `UserConsent` record
- Text: "By using quebec.run, you agree to our [Terms of Service] and [Privacy Policy]"
- Accept button creates consent record with IP + timestamp

**Technical:**
- Check consent status on app load (via React Query)
- POST to `/api/user/consent` on accept
- Capture IP address server-side for audit trail

### 3. Privacy Settings Page (`/[locale]/settings/privacy`)

**Features:**
- Data export: Download all user data as JSON
- Account deletion: Request deletion with 30-day grace period
- Show active deletion request status (if pending)
- Cancel deletion option (within 30 days)

**Data export includes:**
- User profile (email, name, image)
- Clubs owned
- Events created
- Consent records

## API Endpoints

### POST `/api/user/consent`

Create consent record for authenticated user.

**Request:**
```typescript
// Body empty, IP captured server-side
```

**Response:**
```typescript
{ success: true, consentId: string }
```

**Validation:**
- User authenticated (session)
- No existing consent for user
- Capture IP from request headers

### GET `/api/user/data`

Export all user data.

**Response:**
```typescript
{
  user: { id, email, name, image, createdAt },
  clubs: Club[],
  events: Event[],
  consents: UserConsent[]
}
```

**Validation:**
- User authenticated
- Select only necessary fields (avoid over-fetching)

### POST `/api/user/delete`

Request account deletion (30-day grace period).

**Response:**
```typescript
{
  success: true,
  scheduledFor: string, // ISO date 30 days out
  requestId: string
}
```

**Validation:**
- User authenticated
- No active deletion request exists
- Set `scheduledFor` to 30 days from now

### DELETE `/api/user/delete/[id]`

Cancel pending deletion request.

**Response:**
```typescript
{ success: true }
```

**Validation:**
- User authenticated
- Request belongs to user
- Status is "pending"
- Within 30-day window

## Data Flows

### First-Time User Consent

```
1. User authenticates via NextAuth email
2. App loads, checks for UserConsent record
3. No record found → ConsentBanner renders
4. User clicks "Accept"
5. POST /api/user/consent (captures IP)
6. Banner dismisses, normal platform access
```

### Data Export

```
1. User navigates to /[locale]/settings/privacy
2. Clicks "Download my data"
3. GET /api/user/data
4. Server queries User + related records
5. Returns JSON response
6. Browser triggers download
```

### Account Deletion

```
1. User clicks "Delete account" in settings
2. Confirmation modal explains 30-day grace period
3. User confirms
4. POST /api/user/delete
5. Creates DataDeletionRequest (scheduledFor = now + 30 days)
6. UI shows pending status + cancel option
7. [After 30 days] Cron job/manual process deletes user data
8. User can cancel via DELETE /api/user/delete/[id] within window
```

## Implementation Notes

### Zod Validation

Create schemas for API boundaries:
```typescript
// lib/validations/legal.ts
export const ConsentSchema = z.object({
  // IP captured server-side, no body needed
})

export const DeletionRequestSchema = z.object({
  // No body, uses session user
})
```

### IP Address Capture

Use Next.js request headers:
```typescript
const ip = request.headers.get('x-forwarded-for')
  || request.headers.get('x-real-ip')
  || 'unknown'
```

### Footer Links

Update site footer to include:
- Terms of Service
- Privacy Policy
- Both languages accessible via locale switcher

### Testing Strategy

**Unit tests:**
- API route handlers (consent creation, data export logic)
- Validation schemas

**Integration tests:**
- Full consent flow (banner → accept → record creation)
- Data export completeness
- Deletion request lifecycle

**E2E tests:**
- First-time user sees and accepts consent banner
- User can export data from settings
- User can request and cancel deletion

### Cron Job for Deletions

**Initial approach:** Manual processing (query pending requests with `scheduledFor < now`)

**Future:** Add cron job or scheduled task:
```bash
# Daily at 2 AM
0 2 * * * node scripts/process-deletions.js
```

Script queries `DataDeletionRequest` records where:
- `status = 'pending'`
- `scheduledFor <= now()`

Then:
1. Delete user data (cascading via Prisma schema)
2. Update request `status = 'completed'`

## Success Criteria

- [ ] TOS and Privacy Policy pages live in both languages
- [ ] Consent banner shows for new authenticated users
- [ ] Consent records stored with IP + timestamp
- [ ] Users can export data as JSON
- [ ] Users can request account deletion
- [ ] 30-day grace period enforced
- [ ] Users can cancel deletion within window
- [ ] All API endpoints validated with Zod
- [ ] Test coverage ≥95%
- [ ] Footer links functional

## Future Enhancements

**Not needed for launch, consider later:**
- Cookie policy (when adding analytics)
- Email notifications for TOS updates
- Automated cron for deletion processing
- Content moderation guidelines (at scale)
- DMCA policy (if user-generated content grows)
