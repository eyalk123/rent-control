# Backend: Transactions Tab – What We Built & What You Need

Use this prompt with your backend (FastAPI + SQLAlchemy) to implement the APIs and database the mobile app expects for the new **Transactions** tab.

---

## 1. What the frontend already does

The mobile app (React Native / Expo) now has:

- **Transactions tab** in the bottom navigation (icon: cash-multiple).
- **Transactions list screen** with:
  - Search bar (filters by renter name, property name, category, supplier).
  - Filter chips: All / Revenues / Expenses.
  - Scrollable list of transactions (type, property, renter, category/supplier, date, amount, month-for for revenues).
  - Pull-to-refresh and FAB “+” to add a transaction.
- **Add-transaction flow** (`/transactions/add`):
  - Step 1: Choose “Add revenue” or “Add expense”.
  - **Revenue form**: Property (required), Renter (auto-filled from property, can switch), Amount (auto-filled from renter’s monthly rent, editable), Month paid for (required), Date of payment (default today), Payment method (Bit / Cash / Bank transfer), Notes.
  - **Expense form**: Property (required), Renter (optional), Amount, Date of payment, Payment method (required), Category (required), Supplier (optional), Notes.
- **API client** (see `src/api/transactions.ts`) that calls:
  - `GET /transactions` (query: `type`, `property_id`, `renter_id`, `q`)
  - `POST /transactions/revenue`
  - `POST /transactions/expense`
  - `GET /expense-categories`
  - `GET /suppliers` (query: `category_id`, `q`)
  - `GET /properties/{property_id}/renters`
- **Types** (see `src/types/index.ts`): `Transaction`, `TransactionCreateRevenue`, `TransactionCreateExpense`, `ExpenseCategory`, `Supplier`, `PropertyRenterSummary`, `PaymentMethod` (`bit` | `cash` | `bank_transfer`).

The app assumes a **single-tenant / single-owner** model: no `owner_id` in the request bodies. Add auth/tenant filtering on your side if needed.

---

## 2. Database tables to add

### 2.1 `transactions`

| Column           | Type                        | Notes |
|------------------|-----------------------------|--------|
| `id`             | PK (e.g. serial)            | |
| `type`           | enum: `revenue`, `expense`  | |
| `property_id`    | FK → `properties.id`        | NOT NULL |
| `renter_id`      | FK → `renters.id`           | NULLable (expenses can be property-only) |
| `payment_method` | enum: `bit`, `cash`, `bank_transfer` | NULLable for revenue |
| `date_of_payment`| date (or datetime)          | |
| `month_for`      | date or (year, month)       | For revenues: which month the rent is for |
| `amount`         | decimal/numeric             | |
| `currency_code`  | string                      | Snapshot from property at creation |
| `category_id`    | FK → `expense_categories.id`| NULLable (revenue / uncategorized) |
| `supplier_id`    | FK → `suppliers.id`         | NULLable |
| `notes`          | text                        | NULLable |
| `created_at`     | timestamp                   | |
| `updated_at`     | timestamp                   | |

Indexes: `type`, `property_id`, `renter_id`, `date_of_payment` (and composite e.g. `(property_id, type, date_of_payment)` if useful).

### 2.2 `expense_categories`

| Column      | Type    | Notes |
|-------------|---------|--------|
| `id`        | PK      | |
| `key`       | string  | Unique key for i18n (e.g. `electricity`, `air_conditioning`) |
| `is_active` | boolean | |
| `sort_order`| int     | For dropdown ordering |

### 2.3 `suppliers`

| Column       | Type    | Notes |
|--------------|---------|--------|
| `id`         | PK      | |
| `category_id`| FK → `expense_categories.id` | |
| `name`       | string  | Display name |
| `is_active`  | boolean | |
| `phone`      | string  | Optional |
| `email`      | string  | Optional |
| `notes`      | text    | Optional |

---

## 3. Endpoints to implement

Base URL: same as existing API (e.g. `/api` or `/`). Request/response JSON use **snake_case** for the fields below; the frontend maps to camelCase where needed.

### 3.1 List/search transactions

- **`GET /transactions`**
- Query params (all optional): `type` (`revenue` | `expense`), `property_id`, `renter_id`, `q` (text search on renter name, property name, category, notes), `from_date`, `to_date`, `limit`, `offset` (or `page`, `page_size`).
- Response: array of transaction objects (see **Transaction response shape** below), sorted by `date_of_payment` desc, then `created_at` desc.
- Each item must include denormalized display fields: `property_name`, `renter_name`, `category_name` (or `category_key`), `supplier_name` so the app can show them without extra lookups.

### 3.2 Create revenue transaction

- **`POST /transactions/revenue`**
- Body (JSON):
  - `property_id` (number, required)
  - `renter_id` (number, optional)
  - `amount` (number, required)
  - `date_of_payment` (string, optional; ISO date; default today)
  - `month_for` (string, required; e.g. `"2026-02-01"` – day may be ignored)
  - `payment_method` (string, optional: `bit` | `cash` | `bank_transfer`)
  - `notes` (string, optional)
- Server: set `currency_code` from the property; validate property and (if present) renter; insert row with `type = 'revenue'`.
- Response: single transaction object (same shape as in list).

### 3.3 Create expense transaction

- **`POST /transactions/expense`**
- Body (JSON):
  - `property_id` (number, required)
  - `renter_id` (number, optional)
  - `amount` (number, required)
  - `date_of_payment` (string, required; ISO date)
  - `payment_method` (string, required: `bit` | `cash` | `bank_transfer`)
  - `category_id` (number, required)
  - `supplier_id` (number, optional)
  - `notes` (string, optional)
- Server: set `currency_code` from property; validate property, category, and that `supplier_id` (if provided) belongs to `category_id`; insert row with `type = 'expense'`.
- Response: single transaction object.

### 3.4 Transaction response shape (list + create)

Return objects that match this shape (snake_case in JSON is fine; frontend expects camelCase in types, so either use camelCase in JSON or map in the client – currently the frontend types use camelCase for response fields like `currencyCode`, `property_name`, etc.; keep `property_name`, `renter_name`, `category_name`, `supplier_name` for display):

- `id`, `type`, `property_id`, `renter_id`, `payment_method`, `date_of_payment`, `month_for`, `amount`, `currency_code`, `category_id`, `supplier_id`, `notes`
- Plus: `property_name`, `renter_name`, `category_name` (or `category_key`), `supplier_name` for list display.

### 3.5 Expense categories

- **`GET /expense-categories`**
- Response: array of `{ id, key, is_active, sort_order }`, filtered to active, ordered by `sort_order`.

### 3.6 Suppliers

- **`GET /suppliers`**
- Query params (optional): `category_id` (filter by category), `q` (search by name).
- Response: array of `{ id, category_id, name, is_active, ... }`.

### 3.7 Property renters (for auto-fill)

- **`GET /properties/{property_id}/renters`**
- Response: array of renters linked to that property (e.g. active leases), e.g. `{ id, first_name, last_name, monthly_rent }` so the app can auto-fill renter and default amount when adding a revenue transaction.

---

## 4. Validation rules

- Amount &gt; 0 for both revenue and expense.
- Revenue: `month_for` required and valid; `renter_id` (if provided) must belong to `property_id`.
- Expense: `category_id` and `payment_method` required; `supplier_id` (if provided) must belong to `category_id`.
- Use your existing auth/tenant logic on all new routes.

---

## 5. Optional

- **`GET /transactions/{id}`** – single transaction detail (same response shape).
- **`POST /expense-categories`** – create category (if you want in-app category management).
- **`POST /suppliers`** – create supplier (`category_id`, `name`, optional contact fields).

Once these tables and endpoints are in place, the existing frontend will work against your backend without further frontend changes (aside from pointing the API base URL to your server).
