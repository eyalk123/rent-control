# Backend: optional `property_owner` on properties

## Purpose

Optional human-readable label for who owns or co-owns the property (e.g. landlord name). This is **not** the same as `owner_id` (authenticated account / tenant user).

The app uses it for display, add/edit property forms, and client-side search (properties list; transactions and renters lists resolve owner text via loaded properties).

## API changes

| Area | Change |
|------|--------|
| **Model / DB** | Add nullable string column, e.g. `property_owner` (VARCHAR), default `NULL`. |
| **GET /properties** | Include `property_owner` on each property in the JSON (omit or `null` when unset). |
| **GET /properties/:id** | Same. |
| **POST /properties** | Accept optional `property_owner` in the body; persist when provided; treat empty string as `null`. |
| **PATCH /properties/:id** | Accept optional `property_owner`; allow setting or clearing (e.g. `null` to clear). |

## JSON shape (snake_case)

- **Response field:** `property_owner?: string | null`
- **Create / update:** same key, optional

Full contract: [FRONTEND_API_CONTRACT.md](./FRONTEND_API_CONTRACT.md) (Property, PropertyCreate, PropertyUpdate).

## Server-side search (optional)

If you implement `q` / text search on properties or transactions, include `property_owner` in searchable columns so results stay consistent when the client relies on the API instead of local filtering.
