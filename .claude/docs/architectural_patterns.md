# Architectural Rules

**1. Feature Slices (`src/features/<name>/`)**
Strict structure: `api/`, `components/`, `context/`, `hooks/`, `screens/`, `validation/`.

**2. State (React Context)**

- 1 provider per domain (`PropertyContext`, `RenterContext`), stacked in `app/_layout.tsx`.
- Flow: Declare state -> fetch in `useEffect` on mount -> expose `refreshData()` for post-mutation invalidation -> export typed hook (e.g., `usePropertyContext`).

**3. API Layer**

- L1 (`src/core/api/client.ts`): Axios instance (`baseURL` = `EXPO_PUBLIC_API_URL`). Injects Clerk auth token. Extracts `detail` error to `error.userMessage`.
- L2 (`features/<name>/api/`): Typed functions. Sanitizes payloads. Checks `USE_MOCK_API` flag. Catch blocks call `getApiErrorMessage(err)` -> `Alert.alert()`.
- L3 (`src/core/api/mock.ts`): In-memory mock fallback matching API shape.

**4. Forms (RHF + Zod)**

- Flow: Zod schema in `validation/` -> custom hook (`use<Feature>Form` wrapping RHF) -> handle transform/API/refresh/navigate -> `<FeatureForm>` renders UI.
- Shared primitives (`src/shared/components/form/`) use RHF `Controller` for inline validation.

**5. Navigation (Expo Router)**

- `app/(tabs)/_layout.tsx`: Tab config + Auth guard (redirects to `/(auth)/sign-in` if no Clerk session).
- Modals (`add.tsx`, `edit/[id].tsx`) live at `app/<feature>/` root.

**6. i18n & RTL**

- i18next (`en.json`, `he.json`). Language change triggers app reload for RTL layout flip.
- RTL hooks (`useRtlInputStyle`, `useRtlPlaceholder`, etc. in `LanguageContext.tsx`) MUST be used on all form inputs.

**7. Theming (MD3)**

- React Native Paper (`lightTheme`, `darkTheme`, roundness: 16) applied via `<PaperProvider>` in `app/_layout.tsx`. Colors in `src/core/theme/colors.ts`. Android nav bar syncs dynamically.

**8. Data Models**

- Types in `src/shared/types/index.ts` (PascalCase). 3 variants per entity: `Entity`, `EntityCreate` (POST), `EntityUpdate` (PATCH).
- Client uses camelCase; API payloads use snake*case (transform in L2 API module). Env vars must use `EXPO_PUBLIC*` prefix.
