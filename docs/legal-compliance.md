# Legal Compliance Documentation

## Overview

quebec.run implements Terms of Service, Privacy Policy, and data management features to comply with Quebec's Law 25.

## Architecture

### Consent Model

- **Approach:** Usage of platform = acceptance of terms
- **First-time users:** See consent banner after authentication
- **Audit trail:** IP address + timestamp stored in `UserConsent`
- **Updates:** No forced re-consent; continued use = acceptance

### Database Schema

**UserConsent:**

- `userId` (unique) - One consent per user
- `acceptedAt` - Timestamp
- `ipAddress` - For audit trail

**DataDeletionRequest:**

- `userId` - Who requested
- `requestedAt` - When requested
- `scheduledFor` - 30 days from request
- `status` - pending/completed/cancelled

## API Endpoints

### POST /api/user/consent

Create consent record (authenticated)

- Captures IP from request headers
- Returns 400 if consent exists

### GET /api/user/consent

Check consent status (authenticated)

- Returns `{ hasConsent: boolean, consent: UserConsent | null }`

### GET /api/user/data

Export all user data (authenticated)

- Returns JSON with user profile, clubs, events, consents

### POST /api/user/delete

Request account deletion (authenticated)

- Creates deletion request 30 days out
- Returns 400 if pending request exists

### DELETE /api/user/delete/[id]

Cancel pending deletion (authenticated)

- Updates status to 'cancelled'
- Returns 404 if not found or not owned by user

## UI Components

### ConsentBanner

- Fixed bottom banner
- Links to Terms and Privacy pages
- Accept button calls `/api/user/consent`
- Dismisses on success

### Legal Pages

- `/[locale]/legal/terms` - Terms of Service
- `/[locale]/legal/privacy` - Privacy Policy
- Bilingual (en/fr) via next-intl

### Privacy Settings

- `/[locale]/settings/privacy`
- Export data as JSON download
- Request deletion (30-day grace period)
- Cancel pending deletion

## Processing Deletions

**Manual (current):**

```sql
-- Query pending deletions
SELECT * FROM data_deletion_requests
WHERE status = 'pending' AND scheduled_for <= NOW();

-- For each request:
-- 1. Delete user (cascades to all related data)
-- 2. Update request status to 'completed'
```

**Automated (future):**
Create `scripts/process-deletions.js`:

```javascript
// Run daily via cron: 0 2 * * *
const pending = await prisma.dataDeletionRequest.findMany({
  where: { status: 'pending', scheduledFor: { lte: new Date() } },
})

for (const request of pending) {
  await prisma.user.delete({ where: { id: request.userId } })
  await prisma.dataDeletionRequest.update({
    where: { id: request.id },
    data: { status: 'completed' },
  })
}
```

## Law 25 Compliance Checklist

- [x] User consent with audit trail (IP + timestamp)
- [x] Privacy Policy with required disclosures
- [x] Right to access (data export)
- [x] Right to deletion (30-day grace period)
- [x] Right to portability (JSON export)
- [x] Data minimization (select only needed fields)
- [x] Transparency (clear legal pages)
- [x] Bilingual (French + English)

## Testing

**Unit tests:** All service functions tested
**Integration tests:** All API routes tested
**E2E tests:** Consent flow, legal page navigation

**Coverage:** ≥95% (verified via `npm test -- --coverage`)

## Future Enhancements

- Email notifications for TOS updates
- Automated cron job for deletion processing
- Cookie policy (if adding analytics)
- Content moderation guidelines (at scale)
