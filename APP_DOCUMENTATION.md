# Rent-Control — Complete App Documentation

> **Last updated:** 2026-05-20  
> **App version:** 1.0.0  
> **Platform:** iOS · Android · Web (mobile-first)

---

## Table of Contents

1. [App Overview](#1-app-overview)
2. [Design System](#2-design-system)
3. [Navigation Architecture](#3-navigation-architecture)
4. [Screens — Detailed Reference](#4-screens--detailed-reference)
   - [Auth](#41-auth)
   - [Home Tab](#42-home-tab)
   - [Properties Tab](#43-properties-tab)
   - [Renters Tab](#44-renters-tab)
   - [Transactions Tab](#45-transactions-tab)
   - [Settings Tab](#46-settings-tab)
   - [Reports](#47-reports)
5. [Features & Data Models](#5-features--data-models)
   - [Properties](#51-properties)
   - [Renters](#52-renters)
   - [Transactions](#53-transactions)
   - [Suppliers](#54-suppliers)
   - [Expense Categories](#55-expense-categories)
   - [Reports](#56-reports)
6. [Authentication](#6-authentication)
7. [Internationalization & RTL](#7-internationalization--rtl)
8. [Tech Stack & Dependencies](#8-tech-stack--dependencies)

---

## 1. App Overview

**Rent-Control** is a mobile-first property management application for landlords. It tracks properties, renters, lease terms, rent payments, and expenses in one place, with support for generating financial reports.

| Attribute | Value |
|---|---|
| App name | rent-control |
| Bundle ID | `com.eyalk123.rentcontrol` |
| URL scheme | `rentcontrol://` |
| Platforms | iOS, Android, Web |
| Languages | English, Hebrew (full RTL support) |
| Backend | FastAPI (Python), default `http://localhost:8000` |

**Core capabilities:**
- Manage a portfolio of residential and commercial properties
- Track renters with multi-year lease structures and automatic rent escalation
- Record revenue (rent payments) and expenses (categorized, supplier-linked)
- Bulk-enter revenue for multiple renters at once
- Attach documents and receipts
- Generate and export Income & Expense and Expense Log reports (PDF/Excel)
- Full Hebrew RTL layout

---

## 2. Design System

### 2.1 Color Palette — "Landlord Ink"

The palette is navy + cream + mustard. Every color token exists in both light and dark variants.

#### Light Mode

| Token | Hex | Role |
|---|---|---|
| Background | `#FAF7F0` | Screen background (warm cream) |
| Surface / Card | `#FFFFFF` | Cards and sheets |
| Input filled bg | `#F6F3EC` | Filled text input background |
| Primary | `#1E3A5F` | Navy — buttons, active icons, links |
| Secondary / Accent | `#D4A24C` | Mustard — highlights, FABs |
| Text primary | `#1A2D4A` | Main body text |
| Text secondary | `#6B7280` | Captions, hints |
| Text placeholder | `#A8AFBA` | Input placeholder text |
| Input border | `rgba(26,45,74,0.18)` | Outlined input borders |
| Success | `#0F766E` | Teal — revenue, positive states |
| Warning | `#D4A24C` | Mustard — warnings |
| Error | `#9A3412` | Rust — errors, expenses |
| Revenue bg | `rgba(15,118,110,0.12)` | Revenue row tint |
| Expense bg | `rgba(180,83,9,0.13)` | Expense row tint |
| Avatar bg | `#EDF0F4` | Initials avatar background |
| Avatar text | `#1E3A5F` | Initials avatar text |

#### Dark Mode

| Token | Hex | Role |
|---|---|---|
| Background | `#0F1B2D` | Deep warm navy |
| Surface | `#172A44` | Card background |
| Surface elevated | `#1F3556` | Elevated surface (modals, sheets) |
| Primary | `#3E6FA8` | Lighter navy |
| Secondary | `#C29543` | Muted mustard |
| Text primary | `#F1ECDF` | Warm cream |
| Text secondary | `rgba(241,236,223,0.66)` | Dimmed cream |
| Text disabled | `rgba(241,236,223,0.38)` | Disabled text |
| Input bg | `#172A44` | Input background |
| Input border | `rgba(241,236,223,0.20)` | Outlined input border |
| Success | `#34A39A` | Teal (brightened for dark) |
| Error | `#D87559` | Rust (brightened for dark) |
| Revenue bg | `rgba(52,163,154,0.18)` | Revenue row tint |
| Expense bg | `rgba(216,117,89,0.18)` | Expense row tint |
| Avatar bg | `#2A3950` | Dark avatar background |
| Splash screen bg | `#0F1B2D` | Dark splash |

#### Semantic Color Usage

| Situation | Color |
|---|---|
| Revenue amount | Success teal |
| Expense amount | Error rust |
| Lease expiring soon | Warning mustard |
| Overdue payment | Error rust |
| Active/positive status | Success teal |

### 2.2 Typography

The app uses **native platform font stacks** — no custom font files are bundled.

| Platform | Font |
|---|---|
| iOS | System (San Francisco) |
| Android | Roboto |
| Web | System UI |
| Bank account fields | iOS: `Menlo`, Android: `monospace` |

Typography scale is inherited from **React Native Paper MD3** (`MD3LightTheme` / `MD3DarkTheme`).

### 2.3 Icon Sizes

All icons use **Lucide** icons via `lucide-react-native`.

| Token | Size | Usage |
|---|---|---|
| `ICON_XS` | 16 px | Inline / compact areas |
| `ICON_SM` | 20 px | List rows, chips |
| `ICON_MD` | 22 px | Standard icons |
| `ICON_LG` | 24 px | Tab bar icons |
| `ICON_HERO` | 26 px | FAB icons |

### 2.4 Spacing Scale

```
xs   =  4 px
sm   =  8 px
md   = 12 px
lg   = 16 px
xl   = 24 px
xxl  = 32 px

formPaddingHorizontal = 18 px   (all form screens)
keyboardExtraScrollHeight = 100 px  (extra scroll above keyboard)
```

### 2.5 Shape

- **Global border radius:** `16 px` (MD3 `roundness` token, applied to all Paper components)
- Cards, inputs, chips, dialogs, and bottom sheets all inherit this radius.

### 2.6 Theme Modes

Users can choose **Light**, **Dark**, or **System** (follows device preference). The setting is persisted in AsyncStorage. Android navigation bar color syncs dynamically with the active theme.

---

## 3. Navigation Architecture

### 3.1 Router

The app uses **Expo Router 6** (file-based routing). Navigation state is managed by React Navigation under the hood.

### 3.2 Entry Point

`app/index.tsx` is the root. It performs an auth check:
- Not signed in → redirect to `/(auth)/sign-in`
- Signed in → redirect to `/(tabs)/home`

### 3.3 Tab Structure

Bottom tab bar with **5 tabs**:

| Tab | Route | Icon | Label (en/he) |
|---|---|---|---|
| 1 | `/(tabs)/home` | Home | Home / בית |
| 2 | `/(tabs)/properties` | Building | Properties / נכסים |
| 3 | `/(tabs)/renters` | Users | Renters / דיירים |
| 4 | `/(tabs)/transactions` | Receipt | Transactions / תנועות |
| 5 | `/(tabs)/settings` | Settings | Settings / הגדרות |

### 3.4 Full Navigation Graph

```
app/index.tsx
├─ (not authed) ──→ /(auth)/sign-in
│                        └─ (on success) ──→ /(tabs)/home
│
└─ (authed) ──→ /(tabs)/
                ├── home/
                │   ├── [HomeScreen]
                │   ├── → /transactions/add?type=revenue    (Quick Action)
                │   ├── → /transactions/add?type=expense    (Quick Action)
                │   ├── → /renters/add                      (Quick Action)
                │   ├── → /properties/add                   (Quick Action)
                │   ├── → /(tabs)/transactions              (View All)
                │   └── → /reports                          (Reports card)
                │
                ├── properties/
                │   ├── index [PropertiesListScreen]
                │   │   ├── → /properties/[id]
                │   │   └── → /properties/add               (FAB)
                │   └── [id] [PropertyDetailScreen]
                │       └── → /properties/edit/[id]         (Edit btn)
                │
                ├── renters/
                │   ├── index [RentersListScreen]
                │   │   ├── → /renters/[id]
                │   │   └── → /renters/add                  (FAB)
                │   └── [id] [RenterDetailScreen]
                │       └── → /renters/edit/[id]            (Edit btn)
                │
                ├── transactions/
                │   ├── index [TransactionsListScreen]
                │   │   ├── → /transactions/[id]
                │   │   ├── → /transactions/add             (FAB)
                │   │   └── → /transactions/suppliers       (Suppliers FAB)
                │   ├── [id] [TransactionDetailScreen]
                │   │   └── → /transactions/edit/[id]       (Edit btn)
                │   └── suppliers/
                │       ├── index [SuppliersListScreen]
                │       │   ├── → /transactions/suppliers/[id]
                │       │   └── → /transactions/suppliers/add (FAB)
                │       ├── add [AddEditSupplierScreen]
                │       └── [id] [AddEditSupplierScreen]
                │
                └── settings/
                    ├── index [SettingsScreen]
                    │   └── → /settings/delete-account
                    └── delete-account [DeleteAccountScreen]
                        └── (on confirm) ──→ /(auth)/sign-in

── Modal / overlay routes (accessible from anywhere via absolute path) ──
/renters/add              [AddEditRenterScreen]
/renters/edit/[id]        [AddEditRenterScreen]
/properties/add           [AddEditPropertyScreen]
/properties/edit/[id]     [AddEditPropertyScreen]
/transactions/add         [AddTransactionScreen]   (?type=revenue|expense)
/transactions/edit/[id]   [AddTransactionScreen]

── Reports stack ──
/reports                  [ReportsHubScreen]
/reports/income-expense   [IncomeExpenseReportScreen]   (?year=YYYY)
/reports/expense-log      [ExpenseLogReportScreen]       (?year=YYYY)
```

---

## 4. Screens — Detailed Reference

---

### 4.1 Auth

#### Sign-In Screen
**Route:** `/(auth)/sign-in`  
**File:** `app/(auth)/sign-in.tsx`

The only unauthenticated screen. Shows the app logo and name.

**UI elements:**
- App logo + name header
- **Google Sign-In** button (OAuth flow via Firebase + Google)
- Email input field
- Password input field
- **Sign In** button
- **Forgot Password** link → sends a password reset email; success feedback shown in-app
- Toggle link: "New here? Create account" / "Already have an account? Sign in"
  - In **Register mode**: shows first name / last name / email / password / confirm password fields
- Inline validation error messages (via Zod schema)
- API error messages (incorrect credentials, network error)

**Actions → Navigation:**
- Sign in success → `/(tabs)/home`
- Register success → `/(tabs)/home`
- Google sign-in success → `/(tabs)/home`

---

### 4.2 Home Tab

#### Home Screen
**Route:** `/(tabs)/home`  
**File:** `app/(tabs)/home/index.tsx` → `src/features/home/screens/HomeScreen.tsx`

The main dashboard. Loads with skeleton shimmer placeholders while data fetches.

**Sections (top to bottom):**

| Section | Content |
|---|---|
| **Greeting header** | Time-based greeting ("Good Morning / Good Afternoon / Good Evening") + current date |
| **Quick Actions** | 4 buttons: Add Revenue, Add Expense, Add Renter, Add Property |
| **Needs Attention** | Two sub-cards: Overdue Rents (renters with unpaid rent past due date + days overdue), Expiring Leases (leases expiring within threshold period). Empty if nothing to report. |
| **Portfolio** | Summary of the property portfolio (count, occupancy) |
| **Reports card** | Shortcut card linking to the Reports hub |
| **Recent Transactions** | Last 5 transactions with "View All" link → Transactions tab |

**Loading state:** Each section has a `SkeletonBlock` shimmer placeholder with a Reanimated shimmer animation.

**Actions → Navigation:**

| Action | Destination |
|---|---|
| Add Revenue | `/transactions/add?type=revenue` |
| Add Expense | `/transactions/add?type=expense` |
| Add Renter | `/renters/add` |
| Add Property | `/properties/add` |
| View All (transactions) | `/(tabs)/transactions` |
| Reports card | `/reports` |
| Needs Attention item tap | Relevant renter or transaction screen |

---

### 4.3 Properties Tab

#### Properties List Screen
**Route:** `/(tabs)/properties`  
**File:** `app/(tabs)/properties/index.tsx` → `src/features/properties/screens/PropertiesListScreen.tsx`

**UI elements:**
- Scrollable list of `PropertyCard` items
- **Filter chips bar** (horizontal scroll): filter by Property, Renter name, Owner
- Filter bottom sheet (modal drawer) for detailed filter options
- Selection mode: long-press or selection icon toggles multi-select; a header bar appears with "Delete selected" and count badge
- **FAB** (bottom-right, mustard): open Add Property screen
- Pull-to-refresh
- Empty state illustration + message when no properties exist

**PropertyCard shows:**
- Property address + city
- Property type badge (Residential / Commercial)
- Owner name
- Number of renters
- Monthly revenue total

**Actions → Navigation:**

| Action | Destination |
|---|---|
| Tap card | `/properties/[id]` |
| FAB | `/properties/add` |
| Select + delete | Batch API delete, refresh list |

---

#### Property Detail Screen
**Route:** `/properties/[id]`  
**File:** `app/(tabs)/properties/[id].tsx` → `src/features/properties/screens/PropertyDetailScreen.tsx`

Three-tab layout:

**Tab 1 — Info**
- Property photo (or illustrated house preset)
- Address, city, zip code
- Property type, square footage
- Owner name
- Parking number(s)
- Electric / water / gas meter numbers
- Property tax amount, house committee fee
- Inventory notes
- Lease documents section (basic contract, full contract, land registry)

**Tab 2 — Renters**
- List of current renters at this property
- Each renter shows name, monthly rent, lease dates
- Tap renter → `/renters/[id]`

**Tab 3 — Transactions**
- All transactions filtered to this property
- Shows revenue and expenses
- Tap transaction → `/transactions/[id]`

**Header:** Edit button (pencil icon) → `/properties/edit/[id]`

---

#### Add / Edit Property Screen
**Routes:** `/properties/add`, `/properties/edit/[id]`  
**File:** `src/features/properties/screens/AddEditPropertyScreen.tsx`

Multi-section scrollable form:

**Section 1 — Basic Info**
- Owner (creatable dropdown — type new owner name to add)
- Property type (Residential / Commercial dropdown)
- Address (text input)
- City (text input)
- Zip code (text input)

**Section 2 — Additional Details**
- Square footage (numeric)
- Parking numbers (chip input — add multiple)
- Electric meter number(s) (chip input)
- Water meter number(s) (chip input)
- Gas meter number(s) (chip input)
- Property tax (numeric, currency)
- House committee fee (numeric, currency)

**Section 3 — Photo**
- Pick from camera roll OR select a preset illustrated house image (8 presets)

**Section 4 — Files / Documents**
- Basic contract (file picker, PDF)
- Full contract (file picker, PDF)
- Land registry extract (file picker, PDF)
- Custom files (add any number of named files)

**Actions:** Save button (header) — validates with Zod, calls POST/PATCH API, refreshes context, navigates back.

---

### 4.4 Renters Tab

#### Renters List Screen
**Route:** `/(tabs)/renters`  
**File:** `app/(tabs)/renters/index.tsx` → `src/features/renters/screens/RentersListScreen.tsx`

**UI elements:**
- Scrollable list of `RenterCard` items
- Filter chips bar: filter by Property, Renter name, Owner
- Filter bottom sheet for detailed filtering
- Multi-select mode (long-press): batch delete
- **FAB**: Add Renter
- Pull-to-refresh
- Empty state

**RenterCard shows:**
- Avatar (contact photo or initials with colored circle)
- Full name
- Property address
- Monthly rent (from current lease year)
- Lease status indicator (active / expiring / expired)

---

#### Renter Detail Screen
**Route:** `/renters/[id]`  
**File:** `app/(tabs)/renters/[id].tsx` → `src/features/renters/screens/RenterDetailScreen.tsx`

Three-tab layout:

**Tab 1 — Info**
- Avatar (large, contact photo or initials)
- Full name
- Phone number (with Call / SMS action buttons)
- Email address (with Email action button)
- Contact actions: tap to launch phone / SMS / email app

**Sub-section: Lease Info**
- Associated property (link → `/properties/[id]`)
- Lease start date
- Lease end date (calculated from start + years)
- All lease years (year label, rent amount, contract/option type)
- Payment type
- Insurance details (insurer, policy number, expiry)
- Extra contacts (secondary contacts with name + phone)

**Tab 2 — Property**
- Full property details card for the renter's property
- Link → `/properties/[id]`

**Tab 3 — Transactions**
- All transactions for this renter (revenue + expenses)
- Tap → `/transactions/[id]`

**Header:** Edit button → `/renters/edit/[id]`

---

#### Add / Edit Renter Screen
**Routes:** `/renters/add`, `/renters/edit/[id]`  
**File:** `src/features/renters/screens/AddEditRenterScreen.tsx`

Multi-section scrollable form:

**Section 1 — Basic Info**
- Pick from device contacts (auto-fills name, phone, email)
- First name
- Last name
- Phone number
- Email address

**Section 2 — Property**
- Property picker (dropdown of all properties)

**Section 3 — Lease Info**
- Lease start date (date picker)
- Lease years (dynamic — add rows; each row: year label auto-calculated, rent amount, type = Contract / Option)
- Payment type (dropdown)

**Section 4 — Insurance**
- Insurer name
- Policy number
- Expiry date

**Section 5 — Extra Contacts**
- Add secondary contacts (name + phone per contact, add/remove rows)

**Section 6 — Documents**
- Tenant ID image
- Lease documents (custom files)

---

### 4.5 Transactions Tab

#### Transactions List Screen
**Route:** `/(tabs)/transactions`  
**File:** `app/(tabs)/transactions/index.tsx` → `src/features/transactions/screens/TransactionsListScreen.tsx`

**UI elements:**

**Hero section (top):**
- 6-month bar chart (`MonthsBarChart`) — revenue vs. expense bars per month
- Summary stat boxes: Total Revenue, Total Expenses, Net Profit for the selected period
- Current month label

**Filter area:**
- Type filter chips: All / Revenue / Expense
- Active filter pills showing applied filters (property, renter, supplier, date range)
- Filter bottom sheet (opens on filter icon tap) with:
  - Date range picker (from/to month)
  - Property filter
  - Renter filter
  - Supplier filter

**Transaction list:**
- `SectionList` grouped by month (section header = "Month YYYY" + month totals)
- Each `TransactionRow` shows:
  - Icon (revenue = income arrow, expense = expense arrow, colored teal/rust)
  - Supplier or renter name
  - Category (for expenses) or "Rent" (for revenue)
  - Property address
  - Amount (colored, with ₪ symbol)
  - Date
- Paginated: loads 10 at a time, "Load more" at bottom
- Pull-to-refresh

**Selection mode:**
- Multi-select for batch delete
- Selection count badge in header

**FABs (bottom-right, stacked):**
- Primary FAB (mustard): Add Transaction
- Secondary FAB: Manage Suppliers → `/transactions/suppliers`

---

#### Transaction Detail Screen
**Route:** `/transactions/[id]`  
**File:** `app/(tabs)/transactions/[id].tsx` → `src/features/transactions/screens/TransactionDetailScreen.tsx`

**Displays all transaction fields:**

For **Revenue**:
- Type badge (Revenue / הכנסה)
- Amount (large, teal)
- Property
- Renter
- Month the payment covers
- Date of payment
- Payment method (Cash / Bank Transfer / Bit / Check)
- Notes
- Receipt image (if attached)

For **Expense**:
- Type badge (Expense / הוצאה)
- Amount (large, rust)
- Property
- Category
- Supplier (if linked)
- Date
- Payment method
- Notes
- Receipt image (if attached)

**Header:** Edit button → `/transactions/edit/[id]`

---

#### Add / Edit Transaction Screen
**Routes:** `/transactions/add`, `/transactions/edit/[id]`  
**File:** `src/features/transactions/screens/AddTransactionScreen.tsx`

**Step 1 — Choose Type** (shown only for "add" mode):
- Two large cards: **Revenue** (teal) and **Expense** (rust)
- Query param `?type=revenue` or `?type=expense` skips this step

**Step 2a — Revenue Form:**
- Toggle: **Single** / **Bulk** entry

  **Single Revenue:**
  - Property picker
  - Renter picker (filtered by selected property)
  - Amount (numeric, currency)
  - Month for (month/year grid picker — visual calendar grid)
  - Date of payment (date picker)
  - Payment method (radio buttons: Cash / Bank Transfer / Bit / Check)
  - Notes (text area)
  - Receipt image (camera or gallery)

  **Bulk Revenue:**
  - Period filter (owner, month, property)
  - Renter checklist with individual amount inputs (pre-filled from lease)
  - Select all / deselect all
  - Month for picker
  - Date of payment
  - Payment method
  - Submits one transaction per selected renter

**Step 2b — Expense Form:**
- Property picker
- Category picker (dropdown from 12 built-in + custom creatable)
- Supplier picker (dropdown filtered by selected category, with "no supplier" option)
- Amount (numeric, currency)
- Date (date picker)
- Payment method (radio buttons)
- Notes (text area)
- Receipt image (camera or gallery)

---

#### Suppliers List Screen
**Route:** `/transactions/suppliers`  
**File:** `src/features/suppliers/screens/SuppliersListScreen.tsx`

- List of all suppliers (name, categories, phone)
- Tap → edit supplier (`/transactions/suppliers/[id]`)
- FAB → Add supplier
- Toggle active/inactive per supplier

---

#### Add / Edit Supplier Screen
**Routes:** `/transactions/suppliers/add`, `/transactions/suppliers/[id]`  
**File:** `src/features/suppliers/screens/AddEditSupplierScreen.tsx`

Form fields:
- Name
- Phone
- Email
- Categories (multi-select from expense categories)
- Notes
- Bank account (bank code, branch, account number — monospace font)
- Active / Inactive toggle

---

### 4.6 Settings Tab

#### Settings Screen
**Route:** `/(tabs)/settings`  
**File:** `app/(tabs)/settings/index.tsx` → `src/features/settings/screens/SettingsScreen.tsx`

**Sections:**

**Account card:**
- User avatar / photo (from Google profile or initials)
- Display name
- Email address

**Theme:**
- Segmented button: Light / Dark / System
- Immediate effect (no restart needed)

**Language:**
- Segmented button: English / Hebrew
- Changing language triggers app restart to apply RTL layout direction

**Actions:**
- Sign Out button → clears auth state → `/(auth)/sign-in`
- Delete Account button (destructive, red) → `/settings/delete-account`

---

#### Delete Account Screen
**Route:** `/settings/delete-account`  
**File:** `app/(tabs)/settings/delete-account.tsx` → `src/features/settings/screens/DeleteAccountScreen.tsx`

- Warning message explaining what will be deleted
- Confirmation prompt (requires user to confirm intent)
- On confirm:
  - Calls `DELETE /users/me` API
  - Deletes Firebase account
  - Signs user out
  - Navigates to `/(auth)/sign-in`
- Cancel → back to Settings

---

### 4.7 Reports

#### Reports Hub Screen
**Route:** `/reports`  
**File:** `app/reports/index.tsx` → `src/features/reports/screens/ReportsHubScreen.tsx`

**Sections:**

**Report type cards:**

| Report | Description |
|---|---|
| Income & Expense | Monthly revenue vs. expenses breakdown by property and owner |
| Expense Log | Detailed list of all expenses with category totals |

Each card has a "Generate" button.

**Report history:**
- List of previously generated reports
- Each entry shows: report type, year/period, generation date
- Actions per report: Share, Re-export, Delete

---

#### Income & Expense Report Screen
**Route:** `/reports/income-expense`  
**Query param:** `?year=YYYY` (optional, pre-selects year for re-export)  
**File:** `app/reports/income-expense.tsx`

- Year selector dropdown
- "Generate" button → calls report API, downloads file
- Export format options (PDF / Excel)
- Loading indicator during generation

---

#### Expense Log Report Screen
**Route:** `/reports/expense-log`  
**Query param:** `?year=YYYY` (optional)  
**File:** `app/reports/expense-log.tsx`

- Year / date range selector
- "Generate" button
- Export format options (PDF / Excel)

---

## 5. Features & Data Models

---

### 5.1 Properties

**Data Model — `Property`**

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `owner_id` | string | Owner reference (user-created label) |
| `address` | string | Street address |
| `city` | string | City |
| `zip_code` | string | Zip / postal code |
| `type` | `'residential' \| 'commercial'` | Property type |
| `sq_ft` | number? | Square footage |
| `image_url` | string? | Photo URL (Firebase Storage or preset) |
| `parking_numbers` | string[] | Parking spot numbers |
| `electric_meter_numbers` | string[] | Meter identifiers |
| `water_meter_numbers` | string[] | Meter identifiers |
| `gas_meter_numbers` | string[] | Meter identifiers |
| `property_tax` | number? | Annual property tax |
| `house_committee` | number? | Monthly house committee fee |
| `inventory_notes` | string? | Free-text inventory notes |
| `files` | PropertyFile[] | Attached documents |

**API endpoints:**
- `GET /properties` — list
- `GET /properties/{id}` — detail
- `POST /properties` — create
- `PATCH /properties/{id}` — update
- `DELETE /properties/{id}` — delete
- `POST /properties/{id}/image` — upload photo

---

### 5.2 Renters

**Data Model — `Renter`**

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `property_id` | string | Linked property |
| `first_name` | string | First name |
| `last_name` | string | Last name |
| `phone` | string? | Phone number |
| `email` | string? | Email address |
| `lease_start` | string | Lease start date (ISO) |
| `lease_years` | LeaseYear[] | Per-year rent configuration |
| `payment_type` | string? | Payment method preference |
| `insurance_company` | string? | Insurer name |
| `insurance_policy` | string? | Policy number |
| `insurance_expiry` | string? | Policy expiry (ISO) |
| `extra_contacts` | ExtraContact[] | Secondary contacts |
| `contact_id` | string? | Device contact reference |
| `files` | RenterFile[] | Attached documents |

**`LeaseYear` sub-model:**

| Field | Type | Description |
|---|---|---|
| `amount` | number | Monthly rent for this year |
| `type` | `'contract' \| 'option'` | Contract year or option year |
| `year_label` | string (computed) | e.g. "23-24" |

**`ExtraContact` sub-model:**

| Field | Type | Description |
|---|---|---|
| `name` | string | Contact name |
| `phone` | string | Phone number |

**Helper functions:**
- `getRenterMonthlyRent(renter)` — returns rent from first lease year
- `getRentForMonth(renter, month)` — correct rent amount for a specific month (respects multi-year lease changes)
- `getLeaseEndDate(renter)` — calculates lease end from start date + count of lease years

**API endpoints:**
- `GET /renters` — list
- `GET /renters/{id}` — detail
- `POST /renters` — create
- `PATCH /renters/{id}` — update
- `DELETE /renters/{id}` — delete

---

### 5.3 Transactions

**Data Model — `Transaction`**

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `type` | `'revenue' \| 'expense'` | Transaction type |
| `property_id` | string? | Linked property |
| `renter_id` | string? | Linked renter (revenue only) |
| `amount` | number | Amount in ₪ |
| `date_of_payment` | string | Actual payment date (ISO) |
| `month_for` | string? | Month this payment covers (revenue) |
| `category_id` | string? | Expense category |
| `supplier_id` | string? | Linked supplier (expense only) |
| `payment_method` | PaymentMethod | Cash / bank_transfer / bit / check |
| `notes` | string? | Free-text notes |
| `receipt_url` | string? | Attached receipt image URL |

**`PaymentMethod` enum:** `cash` · `bank_transfer` · `bit` · `check`

**Summary model — `MonthBucket`:**
- `month` — ISO month string
- `revenue` — total revenue
- `expenses` — total expenses
- `profit` — net (revenue − expenses)

**API endpoints:**
- `GET /transactions` — list (with filters: type, property_id, renter_id, search, page, page_size)
- `GET /transactions/summary` — 6-month buckets
- `GET /transactions/{id}` — detail
- `POST /transactions/revenue` — create revenue
- `POST /transactions/expense` — create expense
- `PATCH /transactions/revenue/{id}` — update revenue
- `PATCH /transactions/expense/{id}` — update expense
- `DELETE /transactions/{id}` — delete

---

### 5.4 Suppliers

**Data Model — `Supplier`**

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `name` | string | Supplier/vendor name |
| `phone` | string? | Phone |
| `email` | string? | Email |
| `category_ids` | string[] | Expense categories this supplier covers |
| `notes` | string? | Free-text notes |
| `bank_account` | BankAccount? | Bank details |
| `is_active` | boolean | Active / inactive toggle |

**`BankAccount` sub-model:**

| Field | Type | Description |
|---|---|---|
| `bank_code` | string | Bank code |
| `branch` | string | Branch number |
| `account` | string | Account number |

**API endpoints:**
- `GET /suppliers` — list (filters: category_id, search, include_inactive)
- `GET /suppliers/{id}` — detail
- `POST /suppliers` — create
- `PATCH /suppliers/{id}` — update (includes toggling is_active)

---

### 5.5 Expense Categories

12 built-in categories (translated in both languages):

| Key | English | Hebrew |
|---|---|---|
| `maintenance` | Maintenance | תחזוקה |
| `electricity` | Electricity | חשמל |
| `water` | Water | מים |
| `gas` | Gas | גז |
| `insurance` | Insurance | ביטוח |
| `property_tax` | Property Tax | ארנונה |
| `repairs` | Repairs | תיקונים |
| `cleaning` | Cleaning | ניקיון |
| `gardening` | Gardening | גינון |
| `air_conditioning` | Air Conditioning | מיזוג אוויר |
| `management_fee` | Management Fee | דמי ניהול |
| `other` | Other | אחר |

Users can also create **custom categories** via the expense form (inline creatable dropdown).

**API endpoints:**
- `GET /expense-categories` — list active categories
- `POST /expense-categories` — create custom category

---

### 5.6 Reports

Two report types, both exportable as PDF or Excel:

**Income & Expense Report:**
- Scope: full calendar year
- Content: monthly breakdown by property and by owner, with revenue, expenses, and profit columns

**Expense Log Report:**
- Scope: calendar year or custom date range
- Content: all expenses listed chronologically, grouped by category with subtotals

Reports are persisted in the backend. The Reports Hub shows a history of all previously generated reports with options to share, re-export (same parameters), or delete.

---

## 6. Authentication

**Provider:** Firebase Authentication  
**Methods:**
- Google Sign-In (OAuth via `@react-native-google-signin/google-signin`)
- Email / Password (Firebase email auth)
- Password Reset (Firebase sends reset email)

**Flow:**
1. User signs in via Google or email/password.
2. Firebase issues a JWT (ID token).
3. The Axios API client automatically attaches `Authorization: Bearer <token>` on every request via a request interceptor.
4. Token is refreshed automatically by Firebase.
5. On sign-out or account deletion, auth state clears and the app redirects to the sign-in screen.

**Account Deletion:**
- Calls `DELETE /users/me` to remove backend data.
- Then deletes the Firebase account itself.
- User is signed out and returned to sign-in.

---

## 7. Internationalization & RTL

**Framework:** i18next + react-i18next  
**Languages:** English (`en`), Hebrew (`he`)  
**Translation coverage:** ~490 strings per language  
**Language persistence:** AsyncStorage key `app_language`  
**Device detection:** `expo-localization` (falls back to English if language unsupported)

**RTL:**
- Hebrew enables right-to-left layout via `I18nManager.forceRTL(true)`.
- Changing language requires an app restart to apply the layout direction change.
- RTL-aware hooks are used on all form inputs:
  - `useRtlInputStyle()` — text and placeholder alignment
  - `useRtlPlaceholder()` — prepends Unicode RTL mark (`‏`) to placeholder text
  - `useRtlLabelStyle()` — label `textAlign: 'right'` + `writingDirection: 'rtl'`
  - `useSectionHeaderStyle()` — form section header direction

**Translation key areas:**

| Area | Example keys |
|---|---|
| Tabs | `tabs.home`, `tabs.properties`, `tabs.renters`, `tabs.transactions`, `tabs.settings` |
| Home screen | `home.greetingMorning`, `home.quickActions`, `home.needsAttention`, `home.portfolio` |
| Property | `property.address`, `property.owner`, `property.type`, `property.sqFt` |
| Renter | `renter.firstName`, `renter.phone`, `renter.leaseStart`, `renter.monthlyRent` |
| Transactions | `transactions.addRevenue`, `transactions.addExpense`, `transactions.amount`, `transactions.paymentMethod` |
| Expense categories | `expenseCategories.maintenance`, `expenseCategories.electricity`, … |
| Suppliers | `suppliers.title`, `suppliers.addSupplier`, `suppliers.bankAccount` |
| Documents | `documents.basicContract`, `documents.customFiles` |
| Reports | `reports.incomeExpense`, `reports.expenseLog`, `reports.selectYear` |
| Auth | `auth.signIn`, `auth.createAccount`, `auth.forgotPassword` |
| Validation | `validation.addressRequired`, `validation.amountRequired` |
| Errors | `error.savePropertyFailed`, `error.loadFailed` |
| Common | `common.save`, `common.cancel`, `common.back`, `common.delete` |

---

## 8. Tech Stack & Dependencies

### Runtime / Framework

| Library | Version | Role |
|---|---|---|
| React | 19.1.0 | UI framework |
| React Native | 0.81.5 | Mobile runtime |
| Expo | ~54.0.33 | Managed workflow, native modules |
| Expo Router | ~6.0.23 | File-based routing |
| React Navigation | ^7.x | Navigation core |
| React Native Paper | ^5.15.0 | Material Design 3 UI components |

### State & Forms

| Library | Version | Role |
|---|---|---|
| React Hook Form | ^7.71.2 | Form state management |
| @hookform/resolvers | ^5.2.2 | Zod resolver for RHF |
| Zod | ^3.25.76 | Schema validation |

### Networking & Storage

| Library | Version | Role |
|---|---|---|
| Axios | ^1.13.5 | HTTP client |
| @react-native-async-storage/async-storage | 2.2.0 | Local persistence |

### Authentication & Firebase

| Library | Version | Role |
|---|---|---|
| @react-native-firebase/app | ^23.8.8 | Firebase SDK core |
| @react-native-firebase/auth | ^23.8.8 | Firebase Authentication |
| @react-native-firebase/storage | ^23.8.8 | Firebase Storage (uploads) |
| @react-native-google-signin/google-signin | ^16.1.2 | Google OAuth |

### Internationalization

| Library | Version | Role |
|---|---|---|
| i18next | ^23.16.0 | i18n core |
| react-i18next | ^15.7.4 | React bindings |
| expo-localization | ~17.0.8 | Device locale detection |

### UI & Animation

| Library | Version | Role |
|---|---|---|
| lucide-react-native | ^1.14.0 | Icon library |
| react-native-reanimated | ~4.1.1 | Animations (shimmer, transitions) |
| react-native-element-dropdown | ^2.12.4 | Dropdown component |
| expo-navigation-bar | ~5.0.10 | Android nav bar theming |
| expo-contacts | ~15.0.11 | Device contacts access |

### Monitoring

| Library | Version | Role |
|---|---|---|
| @sentry/react-native | ~7.2.0 | Error tracking (Sentry) |

### Expo Plugins Active

- `expo-router` — file-based navigation
- `expo-splash-screen` — custom splash (icon 200 px, light `#ffffff` / dark `#0F1B2D`)
- `expo-localization` — device language
- `expo-build-properties` — Android cleartext traffic
- `@react-native-community/datetimepicker` — native date/time picker
- `expo-navigation-bar` — Android nav bar sync
- `expo-contacts` — contact picker
- `@react-native-firebase/app` — Firebase services
- `@react-native-google-signin/google-signin` — Google sign-in
- `@sentry/react-native/expo` — error reporting

### EAS / Build

| Config | Value |
|---|---|
| EAS Project ID | `751de006-44a2-4bd6-b675-70e0b5af8517` |
| Android package | `com.eyalk123.rentcontrol` |
| iOS bundle ID | `com.eyalk123.rentcontrol` |
| New Architecture | Enabled (`newArchEnabled: true`) |
| API URL env var | `EXPO_PUBLIC_API_URL` |
| Firebase web client env var | `EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID` |
