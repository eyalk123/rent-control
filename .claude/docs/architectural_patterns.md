# Architectural Patterns

## 1. Feature Slice Structure

Every domain feature (`properties`, `renters`, `transactions`, `settings`) follows the same folder layout:

```
src/features/<name>/
├── api/          # Axios calls to backend endpoints
├── components/   # Feature-scoped UI components
├── context/      # React Context + provider + typed hook
├── hooks/        # Custom hooks (e.g., usePropertyForm)
├── screens/      # Full-page screen components
└── validation/   # Zod schemas for forms
```

Examples: `src/features/properties/`, `src/features/renters/`

## 2. State Management — React Context + useEffect Fetch

All domain state lives in a Context provider. Pattern (same across all features):

- `src/features/properties/context/PropertyContext.tsx`
- `src/features/renters/context/RenterContext.tsx`
- `src/core/context/ThemeContext.tsx`, `LanguageContext.tsx`

Each context:
1. Declares state with `useState` (data, loading, error)
2. Fetches on mount in `useEffect`
3. Exposes a `refreshData()` method for post-mutation invalidation
4. Exports a typed hook (`usePropertyContext()`) that throws if used outside the provider

All providers are stacked in `app/_layout.tsx`.

## 3. API Layer — Axios + Feature Modules + Mock Toggle

Three-layer API structure:

**Layer 1 — Axios client** (`src/core/api/client.ts`):
- Single instance with `baseURL` from `EXPO_PUBLIC_API_URL`
- Request interceptor: injects `Authorization: Bearer <clerk_token>`
- Response interceptor: extracts `detail` field into `error.userMessage`

**Layer 2 — Feature API modules** (e.g., `src/features/properties/api/properties.ts`):
- Typed functions: `getProperties()`, `createProperty(data)`, `updateProperty(id, data)`, `deleteProperty(id)`
- Each function sanitizes the payload (only sends allowed fields)
- Checks `USE_MOCK_API` flag and routes to mock or real implementation

**Layer 3 — Mock API** (`src/core/api/mock.ts`):
- In-memory implementation matching real API shape exactly
- Allows full development/testing without a running backend

**Error handling:** Catch blocks call `getApiErrorMessage(err, fallback)` and pass result to `Alert.alert()`.

## 4. Form Pattern — React Hook Form + Zod + Custom Hook

Consistent across all add/edit screens:

1. **Zod schema** in `src/features/<name>/validation/`:  defines field types, constraints, and error messages
2. **`use<Feature>Form` hook** in `src/features/<name>/hooks/`:
   - Wraps `useForm({ resolver: zodResolver(schema) })`
   - Optionally pre-fetches data by ID for edit mode
   - Handles submit: transform form values → API payload → call API → refresh context → navigate back
3. **Screen** passes `formMethods` to a `<FeatureForm>` component that renders `<FormInput>`, `<FormDatePicker>`, etc.

Shared form primitives in `src/shared/components/form/` (`FormInput`, `FormCard`, `FormDatePicker`, `FormDropdown`, etc.) all use `Controller` from RHF and display inline validation errors.

## 5. Navigation — Expo Router (File-Based)

- Files in `app/` directly become routes
- `app/(tabs)/` — bottom tab navigator (4 tabs)
- `app/(auth)/` — auth route group
- Modal screens live at root: `app/properties/add.tsx`, `app/properties/edit/[id].tsx`
- Auth guard is in `app/(tabs)/_layout.tsx`: redirects to `/(auth)/sign-in` if Clerk session is absent

## 6. Internationalization + RTL

**Setup** (`src/core/i18n/index.ts`):
- i18next with `locales/en.json` and `locales/he.json`
- Device locale detected via `expo-localization`; selection persisted to AsyncStorage
- Language change triggers app reload (necessary for RTL layout flip)

**RTL helpers** (`src/core/context/LanguageContext.tsx`):
- `useRtlInputStyle()`, `useRtlPlaceholder()`, `useRtlLabelStyle()`, `useSectionHeaderStyle()`
- All form inputs consume these hooks — RTL is not an afterthought

## 7. Theming — React Native Paper MD3

- Design tokens: `src/core/theme/colors.ts` (light/dark palettes, spacing)
- Theme objects: `src/core/theme/theme.ts` (`lightTheme`, `darkTheme` — MD3 compliant, `roundness: 16`)
- `ThemeContext` (`src/core/context/ThemeContext.tsx`) detects system preference and toggles between themes
- Applied via `<PaperProvider theme={...}>` wrapping the entire app in `app/_layout.tsx`
- Android navigation bar color updated dynamically to match active theme

## 8. TypeScript Path Alias

`@/*` resolves to the repo root (configured in `tsconfig.json`).
All imports use `@/src/...` — no relative `../` imports.

## 9. Data Model Conventions

- TypeScript types: PascalCase, defined in `src/shared/types/index.ts`
- Three variants per entity: `Property` (full), `PropertyCreate` (POST payload), `PropertyUpdate` (PATCH payload)
- TS uses camelCase; API payloads use snake_case (transformation happens inside the feature API module)
- Env vars exposed to client must be prefixed `EXPO_PUBLIC_`
