# Backend: Renter Contact ID

Use this document to add support for linking renters to device contacts in your backend (e.g. FastAPI + SQLAlchemy).

---

## Overview

The mobile app allows users to create a renter by picking from their device's contact list. To display the contact's profile photo without uploading it to the server, the app stores the system contact ID. The image is fetched from the device when displaying the renter.

---

## Database

Add to the `renters` table:

| Column      | Type           | Notes                                            |
|-------------|----------------|--------------------------------------------------|
| `contact_id`| `VARCHAR(255) NULL` | Device-specific system contact ID (iOS/Android) |

No index needed (nullable, low cardinality).

**Migration example (Alembic/SQL):**

```sql
ALTER TABLE renters ADD COLUMN contact_id VARCHAR(255) NULL;
```

---

## API

### POST /renters (create)

- Accept optional `contact_id` (string) in the request body
- Persist `contact_id` if provided
- Omit from body or send `null` for renters created manually

### PATCH /renters/:id (update)

- Accept optional `contact_id` (string or null)
- Allow clearing by sending `null` explicitly

### GET /renters and GET /renters/:id

- Include `contact_id` in the response (string or null)

---

## Notes

- `contact_id` is device-specific: it may differ across devices or after backup/restore.
- The frontend gracefully falls back to initials when the contact no longer exists or is inaccessible.
