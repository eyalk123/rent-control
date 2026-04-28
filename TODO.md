# TODO — Rent Control App

Ordered by importance: critical issues first, polish last.

---

## CRITICAL

### 1. Fix pervasive `as any` type casts in routing
Every route push/redirect uses `as any` to bypass Expo Router's strict types.
- `app/(tabs)/_layout.tsx`, `app/index.tsx`, `app/(tabs)/properties/_layout.tsx`, `app/(tabs)/properties/[id].tsx`, `app/(auth)/sign-in.tsx`
- Fix: generate Expo Router typed routes (`npx expo customize tsconfig.json`) and remove all `as any` casts on `href` props and `router.push/replace` calls.

### 2. Extract a generic context factory — stop duplicating async state logic
`PropertyContext.tsx`, `RenterContext.tsx`, `TransactionContext.tsx` are ~80% identical (loading, error, refresh, useEffect on `isSignedIn`).
- Fix: create `src/core/context/createDataContext.ts` factory that takes a fetcher and returns `{data, loading, error, refresh}`. Each feature wraps it with its own type.

### 3. Move all manual validation in `AddTransactionScreen` into Zod schema
`src/features/transactions/screens/AddTransactionScreen.tsx` manually checks `propertyIds.length === 0`, `amount`, `category`, etc. after submission instead of at the schema level.
- Fix: add `propertyIds: z.array(z.string()).min(1)` and required `amount`/`category` to the Zod schemas in `src/features/transactions/schemas/`.

### 4. Form in `sign-in.tsx` uses manual state — convert to React Hook Form + Zod
`app/(auth)/sign-in.tsx` uses `useState` for email/password with manual `trim()` checks, while the rest of the app uses RHF + Zod.
- Fix: extract `LoginForm` and `RegisterForm` components using RHF; add Zod schema with email format and min-length password validation.

### 5. Silent catch blocks — set error state
`src/features/suppliers/hooks/useSupplierForm.ts:69-70` catches fetch errors and clears loading without setting an error message. User sees blank state with no explanation.
- Fix: every `catch` must call `setError(getDetailMessage(e))` or similar before clearing loading.

---

## HIGH PRIORITY

### 6. Break up God screens
Three screens mix presentation, business logic, and multi-step state:
- `TransactionsListScreen.tsx` (~485 lines): extract `TransactionFilters`, `TransactionSummaryBar`, `TransactionListItem`.
- `AddTransactionScreen.tsx` (~259 lines): extract `RevenueForm`, `ExpenseForm` into their own files (already partly done — finish the split).
- `sign-in.tsx` (~313 lines): extract `LoginForm`, `RegisterForm`, `GoogleSignInButton`.

### 7. Add pagination / FlatList `onEndReached` to all list screens
All three list screens (`PropertiesListScreen`, `RentersListScreen`, `TransactionsListScreen`) fetch every record on mount. On 1 000+ rows the app will freeze.
- Fix: add `page`/`limit` query params to API calls; use `FlatList` `onEndReached` + `ListFooterComponent` spinner for incremental loading.

### 8. Delete property: warn when renters or transactions exist
`PropertiesListScreen.tsx` bulk-deletes properties without checking for linked renters/transactions, leaving orphaned records.
- Fix: before delete confirmation, query `GET /properties/{id}/renters` (or check context); if non-empty, show a second warning dialog listing what will be affected.

### 9. `Promise.all` in bulk operations must track per-item success/failure
`AddTransactionScreen.tsx:134-147` uses `Promise.all` with no individual error tracking. One failing property silently corrupts the success count.
- Fix: replace with `Promise.allSettled`; count `fulfilled` vs `rejected`; surface which properties failed.

### 10. Remove `console.log` statements from auth flow
`app/(auth)/sign-in.tsx:102-113` logs Google auth tokens and credentials.
- Fix: delete all `console.log` calls. Auth tokens must never be logged even in development.

---

## MEDIUM PRIORITY

### 11. Replace full-screen `LoadingOverlay` with skeleton placeholders on initial load
All three list screens show a blocking overlay on first load. Skeleton screens (matching card shapes) give better perceived performance.
- Fix: build a `PropertyCardSkeleton`, `RenterCardSkeleton`, `TransactionRowSkeleton` and show them as `ListEmptyComponent` while `loading && data.length === 0`.

### 12. Distinguish "no results" from "empty list" in empty states
`SuppliersListScreen` shows the same empty state whether there are zero suppliers or a search returned nothing.
- Fix: pass a `variant: 'empty' | 'no-results'` prop to `EmptyState` and show different copy + icon for each case. Transactions already does this correctly — follow that pattern.

### 13. Audit i18n coverage — remove `defaultValue` fallbacks hiding missing keys
Several screens pass `t('key', { defaultValue: 'English string' })` which silently hides untranslated keys in Hebrew.
- Fix: run `i18next-scanner` (or grep for `defaultValue`) to find every such call; add missing keys to `he.json`; remove `defaultValue` fallbacks so missing translations surface as `[missing: key]` in dev.

### 14. Stale transaction data after property/renter delete
`TransactionContext` fetches once on sign-in. Deleting a property doesn't invalidate transactions that reference it.
- Fix: expose a `refreshTransactions` in `TransactionContext` and call it inside the `deleteProperty` / `deleteRenter` flows.

### 15. Add `accessibilityLabel` to interactive cards and summary numbers
`PropertyCard`, `RenterCard`, and `TransactionSummaryCards` have no accessibility labels.
- Fix: add `accessibilityLabel` (e.g., `"Property: Sunset Apartments, 3 units"`) and `accessibilityRole="button"` on pressable cards; add `accessibilityLabel` with spoken value on currency `Text` nodes.

### 16. Currency/phone inputs need formatting masks
`FormInput.tsx` renders raw numbers for currency and phone fields (no thousands separator, no phone grouping).
- Fix: add a `mask` prop to `FormInput`; use `react-native-mask-input` or a simple formatter for `currency` and `phone` field types.

---

## LOW PRIORITY / POLISH

### 17. Replace magic numbers with spacing/color tokens
Scattered hardcoded values: `padding: 24`, `dense ? 40 : 48`, `rgba(0,0,0,0.7)`, `timeout: 10000`.
- Fix: move these into `src/core/theme/constants.ts` (e.g., `OVERLAY_BG`, `API_TIMEOUT_MS`, `INPUT_HEIGHT_DENSE`).

### 18. Standardize API error parsing in `client.ts`
`getDetailMessage()` in `src/core/api/client.ts` has fragile logic for array vs. string `detail` fields from FastAPI validation errors.
- Fix: add a unit test for this function covering `string`, `[{msg}]`, and `{detail: string}` shapes; tighten the type narrowing.

### 19. Navigation guard for invalid IDs in detail screens
`PropertyDetailScreen` and `RenterDetailScreen` show a generic error after a failed fetch when the ID is invalid. The routing layer should catch this earlier.
- Fix: in `_layout.tsx`, validate that `id` is a non-empty string before mounting the detail screen; redirect to the list with a toast if invalid.

### 20. Add unsaved-changes draft persistence to long forms
`AddEditPropertyScreen` warns about unsaved changes but discards the draft if the user confirms navigation.
- Fix: serialize the RHF `watch()` values to AsyncStorage on change; restore on mount; clear on successful submit.

### 21. Review and remove unused hooks
`src/features/renters/hooks/useContactPicker.ts` and `useRenterContactImage.ts` — confirm whether these are wired up anywhere; if not, delete them.

### 22. Property image upload must invalidate context cache
`PropertyHouseImageField.tsx` calls `uploadPropertyImage()` but the property in context still holds the old image URL until the next full refresh.
- Fix: after a successful upload, call `refreshProperties()` (or update the specific property in context directly).

### 23. `toNumber()` in transaction summary silently converts NaN/null to 0
`TransactionsListScreen.tsx:87-100` — negative expense amounts or corrupted data show as 0 revenue with no warning.
- Fix: add a guard that logs/toasts when a non-numeric amount is encountered before coercing to 0.
