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
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN for crash reporting. Local runs only — EAS builds read it from `eas.json`, since `.env` is gitignored |
| `EXPO_PUBLIC_DEV_WEB_PREVIEW` | `1` enables the dev-only browser preview — see [Mock API](#mock-api) |

**`EXPO_PUBLIC_API_URL` depends on where the app runs** — an Android emulator cannot reach
`localhost`, since that resolves to the emulator itself:

| Target | Value |
|---|---|
| iOS simulator / web | `http://localhost:8000` |
| Android emulator | `http://10.0.2.2:8000` |
| Physical device | `http://YOUR_COMPUTER_IP:8000` |

### Mock API

To look at the UI in a browser with no backend running, set `EXPO_PUBLIC_DEV_WEB_PREVIEW=1` and run
`npm run web`.

`@react-native-firebase` is a native module, so `getAuth()` throws in a browser and the app can
never get past the auth guard. That flag skips Firebase, pretends you are signed in, and turns
`USE_MOCK_API` on (`src/core/api/mock.ts`) — there is no real token to call the backend with. It is
guarded by `__DEV__` **and** `Platform.OS === 'web'`, so it cannot reach a build or a device.

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

- `app/` — Expo Router routes. `(tabs)/` is the 5-tab shell (Home, Properties, Renters,
  Transactions, Chat); `(auth)/` is sign-in. **Settings is deliberately not a tab** — it lives at
  `app/settings/` outside the tab navigator, opened from the gear button in each tab header, and
  guards auth itself because signing out happens there. Root layouts hold the providers.
- `src/core/` — Axios client, theme, i18n, core contexts.
- `src/features/` — feature slices (home, properties, renters, transactions, suppliers, reports,
  notifications, settings, document-scan, agent).

`@/*` resolves to the repo root, and **all imports must use `@/src/...`** — no relative `../`
paths. (Note this differs from the web app, where `@` maps to `src` itself.)

## Crash reporting (Sentry)

Initialised in `app/_layout.tsx`. Three things about it regularly surprise people:

- **Dev builds report nothing.** `enabled: !__DEV__` means Expo Go, a dev client and
  `expo start` are all deliberately silent. Only release builds report, so a smoke test
  has to be run against one.
- **The DSN comes from `eas.json`, not `.env`.** `.env` is gitignored and never reaches an
  EAS build, so the DSN lives in each build profile's `env` block. A DSN is public — it
  identifies a project, it does not grant access to it.
- **The org is EU-hosted**, so the config plugin points `sentry-cli` at
  `https://de.sentry.io/`. Left at the default it talks to the US instance, where the
  credentials do not resolve.

Readable stack traces additionally need `SENTRY_AUTH_TOKEN` at build time — a real secret,
so it belongs in EAS rather than in the repo:

```bash
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value <token>
```

Without it the build still succeeds and still reports; the traces just arrive minified and
unsymbolicated.

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
