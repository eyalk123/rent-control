# Rent-Control — CLAUDE.md

## Project Overview

Mobile-first property management app for rental business owners. Manages properties, renters, and financial transactions with multi-language support (English + Hebrew RTL). Built with Expo/React Native targeting iOS, Android, and web.

Backend: FastAPI (Python), configured via `EXPO_PUBLIC_API_URL`. Auth: Clerk.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo 54 + React Native 0.81 + React 19 |
| Language | TypeScript 5.9 |
| Routing | Expo Router 6 (file-based) |
| UI | React Native Paper (Material Design 3) |
| State | React Context API |
| Forms | React Hook Form + Zod |
| HTTP | Axios (`src/core/api/client.ts`) |
| Auth | Clerk (`@clerk/clerk-expo`) |
| i18n | i18next + react-i18next (en, he) |
| Storage | AsyncStorage + Expo Secure Store |

## Key Directories

| Path | Purpose |
|---|---|
| `app/` | Expo Router screens and layouts (file = route) |
| `app/(tabs)/` | 4-tab shell: properties, transactions, renters, settings |
| `app/(auth)/` | Sign-in flow |
| `src/core/` | Axios client, theme, i18n, core contexts |
| `src/features/` | Feature slices: properties, renters, transactions, settings |
| `src/shared/` | Cross-feature types, form components, UI primitives |
| `src/context/` | Re-exports all context providers for clean imports |
| `docs/` | API contracts and backend specs |
| `assets/` | Images, icons, splash screens |

Each feature slice (`src/features/<name>/`) contains: `api/`, `components/`, `context/`, `hooks/`, `screens/`, `validation/`.

## Essential Commands

```bash
npm start          # Start Expo dev server (interactive: iOS/Android/web)
npm run android    # Start targeting Android
npm run ios        # Start targeting iOS
npm run web        # Start targeting web
npm run lint       # ESLint (expo config)
```

**Environment:** Copy `.env.example` to `.env` and set:
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_URL`

**Mock API:** Toggle `USE_MOCK_API` in `src/core/api/mock.ts` to develop without a backend.

## Key Entry Points

- `app/_layout.tsx` — Root layout: all providers (Clerk, Gesture Handler, Safe Area, Theme, Language)
- `app/(tabs)/_layout.tsx` — Tab navigation config + auth guard
- `src/core/api/client.ts` — Axios instance with auth interceptor and error extraction
- `src/shared/types/index.ts` — All domain types (`Property`, `Renter`, `Transaction`, etc.)

## Additional Documentation

Check these files when working on related tasks:

| File | When to read |
|---|---|
| `.claude/docs/architectural_patterns.md` | State management, API layer, form pattern, RTL/i18n, theming |
