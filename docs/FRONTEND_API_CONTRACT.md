# Frontend API Contract

This document lists every request and response type the frontend uses when calling the backend. Use it to ensure backend endpoints, query params, and JSON shapes match.

**Source of truth:** `src/shared/types/index.ts` and the API modules under `src/features/*/api/`.

**Conventions:**
- All request/response bodies are JSON unless noted (e.g. `FormData`).
- Optional fields are marked with `?`. `| null` means the field can be explicitly null.
- Query parameter names are **snake_case** (e.g. `property_id`, `renter_id`).

---

## Shared types (used across endpoints)

### Enums / unions

```ts
PropertyType = 'apartment' | 'house' | 'commercial'

LeaseYearType = 'option' | 'contract'

TransactionType = 'revenue' | 'expense'

PaymentMethod = 'bit' | 'cash' | 'bank_transfer'
```

### Nested / referenced shapes

```ts
interface PropertyBrief {
  id: number;
  address: string;
  city: string;
  type: PropertyType;
}

interface LeaseYear {
  amount: number;   // yearly rent for that year
  type: LeaseYearType;
}
```

---

## 1. Properties

### GET /properties

**Response:** `Property[]`

```ts
interface Property {
  id: number;
  owner_id: number;
  address: string;
  city: string;
  zip_code: string;
  type: PropertyType;
  sq_ft: number;
  purchase_price: number;
  image_url: string | null;
  number_of_rooms?: number | null;
  parking_numbers?: string[] | null;
  electricity_meter_number?: string | null;
  water_meter_number?: string | null;
  water_account_number?: string | null;
  electricity_account_number?: string | null;
  property_tax?: number | null;
  house_committee?: number | null;
  property_owner?: string | null;  // display label; distinct from owner_id (account)
  renters: Renter[] | null;
  hasRenters?: boolean;  // optional, for list occupancy display
}
```

---

### GET /properties/:id

**Response:** `Property` (same as above)

---

### POST /properties

**Request body:** `PropertyCreate`

```ts
interface PropertyCreate {
  address: string;
  city: string;
  zip_code: string;
  type: PropertyType;
  sq_ft: number;
  purchase_price: number;
  image_url?: string | null;
  number_of_rooms?: number | null;
  parking_numbers?: string[] | null;
  electricity_meter_number?: string | null;
  water_meter_number?: string | null;
  water_account_number?: string | null;
  electricity_account_number?: string | null;
  property_tax?: number | null;
  house_committee?: number | null;
  property_owner?: string | null;
}
```

**Response:** `Property`

---

### PATCH /properties/:id

**Request body:** `PropertyUpdate` (all fields optional)

```ts
interface PropertyUpdate {
  address?: string;
  city?: string;
  zip_code?: string;
  type?: PropertyType;
  sq_ft?: number;
  purchase_price?: number;
  image_url?: string | null;
  number_of_rooms?: number | null;
  parking_numbers?: string[] | null;
  electricity_meter_number?: string | null;
  water_meter_number?: string | null;
  water_account_number?: string | null;
  electricity_account_number?: string | null;
  property_tax?: number | null;
  house_committee?: number | null;
  property_owner?: string | null;
}
```

**Response:** `Property`

---

### DELETE /properties/:id

**Request body:** none  
**Response:** none (204 or empty success)

---

### POST /properties/:id/image

**Request body:** `FormData` (multipart), not JSON. Frontend sends a file under a key the backend expects for the image.

**Response:** `Property`

---

## 2. Renters

### GET /renters

**Response:** `Renter[]`

```ts
interface Renter {
  id: number;
  property_id: number | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  lease_years: LeaseYear[];
  lease_start: string;
  number_of_payments?: number | null;
  payment_type?: string | null;
  payment_day_of_month?: number | null;
  insurance_type?: string | null;
  insurance_amount?: number | null;
  property: PropertyBrief | null;
}

interface LeaseYear {
  amount: number;
  type: LeaseYearType;  // 'option' | 'contract'
}
```

---

### GET /renters/:id

**Response:** `Renter` (same as above)

---

### POST /renters

**Request body:** `RenterCreate`

```ts
interface RenterCreate {
  property_id?: number | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  lease_years: LeaseYear[];
  lease_start: string;
  number_of_payments?: number | null;
  payment_type?: string | null;
  payment_day_of_month?: number | null;
  insurance_type?: string | null;
  insurance_amount?: number | null;
}
```

**Response:** `Renter`

---

### PATCH /renters/:id

**Request body:** `RenterUpdate` (all fields optional)

```ts
interface RenterUpdate {
  property_id?: number | null;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  lease_years?: LeaseYear[];
  lease_start?: string;
  number_of_payments?: number | null;
  payment_type?: string | null;
  payment_day_of_month?: number | null;
  insurance_type?: string | null;
  insurance_amount?: number | null;
}
```

**Response:** `Renter`

---

### DELETE /renters/:id

**Request body:** none  
**Response:** none (204 or empty success)

---

## 3. Property renters (summary list)

### GET /properties/:propertyId/renters

**Response:** `PropertyRenterSummary[]`

```ts
interface PropertyRenterSummary {
  id: number;
  first_name: string;
  last_name: string;
  monthly_rent: number;  // e.g. derived from first lease year (amount/12)
}
```

---

## 4. Transactions

### GET /transactions

**Query params (snake_case):**

| Frontend param | Sent as   | Type    |
|----------------|-----------|--------|
| type           | type      | 'revenue' \| 'expense' |
| propertyId     | property_id | number |
| renterId       | renter_id | number |
| search         | q         | string |

**Response:** `Transaction[]`

```ts
interface Transaction {
  id: number;
  type: TransactionType;
  property_id: number;
  renter_id: number | null;
  payment_method: PaymentMethod | null;
  date_of_payment: string;
  month_for: string | null;   // YYYY-MM or date string, revenues only
  amount: number;
  currencyCode: string;
  category_id: number | null;
  supplier_id: number | null;
  notes: string | null;
  property_name: string;
  renter_name: string | null;
  category_name: string | null;
  supplier_name: string | null;
}
```

---

### POST /transactions/revenue

**Request body:** `TransactionCreateRevenue`

```ts
interface TransactionCreateRevenue {
  property_id: number;
  renter_id?: number | null;
  amount: number;
  date_of_payment?: string;   // ISO date, backend can default to today
  month_for: string;          // month rent was paid for (e.g. 2026-02-01)
  payment_method?: PaymentMethod;
  notes?: string;
}
```

**Response:** `Transaction`

---

### POST /transactions/expense

**Request body:** `TransactionCreateExpense`

```ts
interface TransactionCreateExpense {
  property_id: number;
  renter_id?: number | null;
  amount: number;
  date_of_payment: string;
  payment_method: PaymentMethod;
  category_id: number;
  supplier_id?: number | null;
  notes?: string;
}
```

**Response:** `Transaction`

---

## 5. Expense categories

### GET /expense-categories

**Response:** `ExpenseCategory[]`

Returns both predefined categories (with `key`) and user-created categories (with `name`).

```ts
interface ExpenseCategory {
  id: number;
  key?: string;    // predefined only (e.g. electricity, maintenance)
  name?: string;   // user-created only
  is_active: boolean;
  sort_order: number;
}
```

---

### POST /expense-categories

**Request body:** `ExpenseCategoryCreate`

Creates a user-defined category (no `key`, only `name`).

```ts
interface ExpenseCategoryCreate {
  name: string;
}
```

**Response:** `ExpenseCategory` (created category with `name`, no `key`)

---

## 6. Suppliers

### GET /suppliers

**Query params (snake_case):**

| Frontend param | Sent as         | Type    | Notes                                              |
|----------------|-----------------|---------|----------------------------------------------------|
| categoryId     | category_id     | number  | Filter suppliers that have this category           |
| search         | q               | string  | Search by name                                     |
| includeInactive| include_inactive| boolean | If true, include suppliers with is_active=false    |

**Response:** `Supplier[]`

```ts
interface Supplier {
  id: number;
  category_ids: number[];
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  is_active: boolean;
}
```

---

### GET /suppliers/:id

**Response:** `Supplier` (single supplier, for edit-screen prefill)

---

### POST /suppliers

**Request body:** `SupplierCreate`

```ts
interface SupplierCreate {
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  category_ids: number[];
}
```

**Response:** `Supplier`

---

### PATCH /suppliers/:id

**Request body:** `SupplierUpdate` (all fields optional)

For soft delete, send `{ is_active: false }`.

```ts
interface SupplierUpdate {
  name?: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  category_ids?: number[];
  is_active?: boolean;
}
```

**Response:** `Supplier`

---

## Optional: wrapped responses

If the backend returns a wrapper instead of the raw array/object:

```ts
interface APIResponse<T> {
  data: T;
  message?: string;
}
```

Then the frontend expects the **actual payload in `response.data`** (axios already gives `response.data`). So if the backend returns `{ data: Renter }`, the frontend will receive that object and use `response.data` as the `Renter`; no change needed. If the backend returns the `Renter` at the top level, that also works. This doc describes the **inner** type the frontend uses (e.g. `Renter`, `Transaction[]`).

---

## Summary table

| Method | Path                          | Request body           | Response           |
|--------|-------------------------------|------------------------|--------------------|
| GET    | /properties                   | —                      | Property[]         |
| GET    | /properties/:id               | —                      | Property           |
| POST   | /properties                   | PropertyCreate         | Property           |
| PATCH  | /properties/:id               | PropertyUpdate         | Property           |
| DELETE | /properties/:id               | —                      | —                  |
| POST   | /properties/:id/image         | FormData               | Property           |
| GET    | /renters                      | —                      | Renter[]           |
| GET    | /renters/:id                  | —                      | Renter             |
| POST   | /renters                      | RenterCreate           | Renter             |
| PATCH  | /renters/:id                  | RenterUpdate           | Renter             |
| DELETE | /renters/:id                  | —                      | —                  |
| GET    | /properties/:id/renters       | —                      | PropertyRenterSummary[] |
| GET    | /transactions                 | query: type, property_id, renter_id, q | Transaction[] |
| POST   | /transactions/revenue         | TransactionCreateRevenue | Transaction     |
| POST   | /transactions/expense         | TransactionCreateExpense | Transaction     |
| GET    | /expense-categories           | —                      | ExpenseCategory[]  |
| POST   | /expense-categories           | ExpenseCategoryCreate   | ExpenseCategory    |
| GET    | /suppliers                    | query: category_id, q, include_inactive | Supplier[] |
| GET    | /suppliers/:id                | —                      | Supplier           |
| POST   | /suppliers                    | SupplierCreate          | Supplier           |
| PATCH  | /suppliers/:id                | SupplierUpdate          | Supplier           |
