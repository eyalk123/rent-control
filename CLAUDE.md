# Rent-Control

Mobile-first property management app (iOS/Android/web). English + Hebrew (RTL).

**Tech Stack:** Expo 54, React Native 0.81, React 19, TS 5.9, Expo Router 6, React Native Paper (MD3), Context API, React Hook Form + Zod, Axios, Firebase Auth + Google Sign-In, i18next, AsyncStorage. Backend: FastAPI.

**Commands:**

- `npm start` (interactive dev), `npm run android`, `npm run ios`, `npm run web`, `npm run lint`
- Env vars: Copy `.env.example` to `.env` (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID`).
- Mock API: `USE_MOCK_API` (`src/core/api/mock.ts`) is derived from `EXPO_PUBLIC_DEV_WEB_PREVIEW=1`, the dev-only browser-preview flag that also stubs Firebase auth so `npm run web` gets past the auth guard. Guarded by `__DEV__` + `Platform.OS === 'web'`.

**Directories & Aliases:**

- `app/`: Expo Router routes. `(tabs)/` is a 5-tab shell (Home, Properties, Renters, Transactions, Chat); `(auth)/` is sign-in. **Settings is not a tab** — it lives at `app/settings/`, outside the tab navigator, reached from the `SettingsGearButton` in each tab header, and carries its own auth guard. Root layouts hold providers.
- `src/core/`: Axios, theme, i18n, core contexts.
- `src/features/`: Feature slices (home, properties, renters, transactions, suppliers, reports, notifications, settings, document-scan, agent). `agent/` is the "Ask Rent Control" assistant — SSE streaming against `POST /agent/chat`, read-only.
- `@/*` resolves to repo root. All imports must use `@/src/...` (no relative `../`).

**ROUTING INSTRUCTIONS:**
Before creating, modifying, or debugging any core logic (State, API, Forms, Navigation, i18n/RTL, or Theming), you MUST read `.claude/docs/architectural_patterns.md` first.
