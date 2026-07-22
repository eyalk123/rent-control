# Rent Control — Mobile

iOS and Android client for **Rent Control**, a property-management app for landlords
(Hebrew/RTL + English). It talks to the [Rent Control backend](https://github.com/eyalk123/rent-control-backend),
whose README is the **overview of the whole system** — read it first if you're new here.

Sibling clients: [rent-control-web](https://github.com/eyalk123/rent-control-web) (web app).

## Tech stack

- **Expo 54** + **React Native 0.81** + **React 19** + **TypeScript 5.9**
- **Expo Router 6** — file-based routing
- **React Native Paper** (Material Design 3)
- **React Hook Form** + **zod** for forms/validation
- **Axios** for the API client; Context API for state
- **Firebase** Auth (email/password + Google Sign-In)
- **i18next** (en + he, with RTL layout)
- **AsyncStorage** for local persistence
- **Sentry** for crash reporting

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values
npm start              # interactive Expo dev server
```

Start the backend before the app, or point `EXPO_PUBLIC_API_URL` at the deployed one.

### Environment variables

All client vars are prefixed `EXPO_PUBLIC_` and are **embedded in the build** — treat them as
public.

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL — see the table below |
| `EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID` | Firebase web client ID (Console → Project Settings → Your apps → Web app) |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for crash reporting |

**`EXPO_PUBLIC_API_URL` depends on where the app runs** — an Android emulator cannot reach
`localhost`, since that resolves to the emulator itself:

| Target | Value |
|---|---|
| iOS simulator / web | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical device | `http://YOUR_COMPUTER_IP:8000` |

### Mock API

To work on UI with no backend running, toggle `USE_MOCK_API` in `src/core/api/mock.ts`.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Expo dev server (interactive) |
| `npm run android` | `expo run:android` — native build + run |
| `npm run ios` | `expo run:ios` — native build + run |
| `npm run web` | Expo on web |
| `npm run lint` | `expo lint` |
| `npm run pad-icon` | Regenerate padded app icon assets |

> **There is currently no test suite in this repo** — no unit tests, no E2E. Verify changes by
> running the app.

> **Do not run `npm run reset-project`.** It is a leftover from the `create-expo-app` template
> and it *moves the entire `app/` directory aside* to scaffold a blank one. It would gut this app.

## Project layout

- `app/` — Expo Router routes. `(tabs)/` is the 4-tab shell; `(auth)/` is sign-in. Root layouts
  hold the providers.
- `src/core/` — Axios client, theme, i18n, core contexts.
- `src/features/` — feature slices (properties, renters, transactions, settings).

`@/*` resolves to the repo root, and **all imports must use `@/src/...`** — no relative `../`
paths. (Note this differs from the web app, where `@` maps to `src` itself.)

## Builds and releases

Built and shipped with **EAS** (`eas.json`), bundle id `com.eyalk123.rentcontrol`:

| Profile | Purpose |
|---|---|
| `development` | Dev client build |
| `preview` | Internal distribution |
| `simulator` | iOS simulator build |
| `production` | App Store release |

All profiles point at the production backend
(`https://rent-control-backend-production.up.railway.app`), so a build will not talk to your
local API unless you change that. iOS submission credentials are configured in `eas.json`.
