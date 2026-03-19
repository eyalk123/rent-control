# Backend: Suppliers & Categories Refactoring

Implement the backend changes required to support the new suppliers and expense categories management in the Rent Control mobile app.

---

## Summary of Changes

1. **Expense categories**: Support user-created categories (with `name`) in addition to predefined ones (with `key`). Add `POST /expense-categories`.
2. **Suppliers**: Change from single category per supplier to multiple categories. Add `phone`, `email`, `notes`. Add full CRUD: `GET` (all/list), `GET /:id`, `POST`, `PATCH`.
3. **Transaction validation**: When creating an expense with `supplier_id`, validate that the supplier has the expense `category_id` in its categories and is active.

---

## 1. Database Schema Changes

### 1.1 `expense_categories` table

**Current shape (assumed):**
- `id`, `key`, `is_active`, `sort_order`

**Required changes:**
- Add `name VARCHAR(255) NULL` — for user-created categories only; predefined categories use `key`, user-created use `name`
- Either `key` or `name` must be present per row
- Predefined: `key` set, `name` NULL
- User-created: `name` set, `key` NULL (or derive a slug from name if you want a unique key)

**Migration example:**
```sql
ALTER TABLE expense_categories ADD COLUMN name VARCHAR(255) NULL;
```

### 1.2 `suppliers` table

**Current shape (assumed):**
- `id`, `category_id` (FK → expense_categories), `name`, `is_active`

**Required changes:**
- Replace `category_id` with a many-to-many relation: create `supplier_categories` junction table, or add `category_ids` JSON/array column
- Add `phone VARCHAR(255) NULL`
- Add `email VARCHAR(255) NULL`
- Add `notes TEXT NULL`

**Option A – Junction table (recommended):**
```sql
-- New junction table
CREATE TABLE supplier_categories (
  supplier_id INT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, category_id)
);

-- Add new columns to suppliers
ALTER TABLE suppliers ADD COLUMN phone VARCHAR(255) NULL;
ALTER TABLE suppliers ADD COLUMN email VARCHAR(255) NULL;
ALTER TABLE suppliers ADD COLUMN notes TEXT NULL;

-- Migrate existing category_id → supplier_categories, then drop category_id
-- (migration script required)
```

**Option B – JSON/array column:**
```sql
ALTER TABLE suppliers ADD COLUMN category_ids JSONB;  -- or ARRAY for PostgreSQL
ALTER TABLE suppliers ADD COLUMN phone VARCHAR(255) NULL;
ALTER TABLE suppliers ADD COLUMN email VARCHAR(255) NULL;
ALTER TABLE suppliers ADD COLUMN notes TEXT NULL;
-- Migrate category_id to category_ids array, then drop category_id
```

---

## 2. API Endpoints

All request/response bodies use **snake_case** in JSON (e.g. `category_ids`, `is_active`).
Base URL: same as existing API.

---

### 2.1 Expense Categories

#### GET /expense-categories

**Response:** `ExpenseCategory[]`

Return both predefined (with `key`) and user-created (with `name`) categories, ordered by `sort_order`.

```ts
interface ExpenseCategory {
  id: number;
  key?: string;    // predefined only (e.g. "electricity", "maintenance")
  name?: string;   // user-created only
  is_active: boolean;
  sort_order: number;
}
```

---

#### POST /expense-categories (NEW)

**Request body:**
```json
{
  "name": "Plumber Joe"
}
```

**Validation:**
- `name` is required and non-empty
- Trim whitespace

**Response:** Created `ExpenseCategory` with `name` set, `key` null. Set `sort_order` to max+1, `is_active` true.

---

### 2.2 Suppliers

#### GET /suppliers (MODIFIED)

**Query params (snake_case):**

| Param              | Type    | Required | Description                                             |
|--------------------|---------|----------|---------------------------------------------------------|
| category_id        | number  | no       | Filter suppliers that have this category in their list |
| q                  | string  | no       | Search by name, phone, or email                         |
| include_inactive   | boolean | no       | Default false; if true, include suppliers with is_active=false |

**Response:** `Supplier[]`

```ts
interface Supplier {
  id: number;
  category_ids: number[];   // array of expense_category ids
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  is_active: boolean;
}
```

**Behavior:**
- Without `category_id`: return all (or filtered by `q`, `include_inactive`)
- With `category_id`: return only suppliers whose `category_ids` include that category
- Default `include_inactive=false`: exclude inactive suppliers

---

#### GET /suppliers/:id (NEW)

**Response:** Single `Supplier` (same shape as above). For edit-screen prefill.
404 if not found.

---

#### POST /suppliers (NEW)

**Request body:**
```json
{
  "name": "Joe Plumber",
  "phone": "512-555-1001",
  "email": "joe@plumber.com",
  "notes": "Emergency plumber",
  "category_ids": [1, 4]
}
```

**Validation:**
- `name` required, non-empty
- `category_ids` required, non-empty array of valid `expense_categories.id`
- `phone`, `email`, `notes` optional

**Response:** Created `Supplier`

---

#### PATCH /suppliers/:id (NEW)

**Request body (all fields optional):**
```json
{
  "name": "Joe Plumber Inc",
  "phone": "512-555-1002",
  "email": "joe@plumber.com",
  "notes": "Updated notes",
  "category_ids": [1, 4, 5],
  "is_active": false
}
```

For soft delete: send `{ "is_active": false }`. Do not physically delete; existing transactions keep the `supplier_id` reference.

**Response:** Updated `Supplier`

---

### 2.3 Transactions

#### POST /transactions/expense (MODIFIED VALIDATION)

**Existing request body** (unchanged):
```json
{
  "property_id": 1,
  "amount": 150,
  "date_of_payment": "2025-03-19",
  "payment_method": "bit",
  "category_id": 2,
  "supplier_id": 5,
  "notes": "..."
}
```

**New validation rule when `supplier_id` is provided:**
1. Supplier must exist
2. Supplier must have `is_active === true`
3. Supplier must have `category_id` (the expense’s category) in its `category_ids` array

If any check fails, return 400 with a clear error message.

---

## 3. Field Mapping Reference

| Frontend (camelCase) | Backend (snake_case) |
|---------------------|------------------------|
| categoryIds         | category_ids           |
| includeInactive     | include_inactive       |
| categoryId          | category_id            |

Axios/backend may handle conversion; ensure JSON uses snake_case for these fields if the frontend expects it.

---

## 4. Seed Data (Optional)

If you seed expense categories, keep predefined ones with `key`:
- maintenance, electricity, water, gas, insurance, property_tax, repairs, cleaning, gardening, air_conditioning, management_fee, other

---

## 5. Auth / Tenant

Apply the same auth and tenant scoping used for properties, renters, and transactions to all new supplier and category endpoints.

---

## 6. Checklist

- [ ] Add `name` to `expense_categories`
- [ ] Create `supplier_categories` (or equivalent) for many-to-many
- [ ] Add `phone`, `email`, `notes` to `suppliers`
- [ ] Migrate existing `category_id` data to new schema
- [ ] Implement `POST /expense-categories`
- [ ] Implement `GET /suppliers` with new query params and response shape
- [ ] Implement `GET /suppliers/:id`
- [ ] Implement `POST /suppliers`
- [ ] Implement `PATCH /suppliers/:id`
- [ ] Update `POST /transactions/expense` validation for `supplier_id`
