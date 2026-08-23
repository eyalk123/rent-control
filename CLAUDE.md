# Rent-Control

Mobile-first property management app (iOS/Android/web). English + Hebrew (RTL).

**Tech Stack:** Expo 54, React Native 0.81, React 19, TS 5.9, Expo Router 6, React Native Paper (MD3), Context API, React Hook Form + Zod, Axios, Firebase Auth + Google Sign-In, i18next, AsyncStorage. Backend: FastAPI.

**Commands:**

- `npm start` (interactive dev), `npm run android`, `npm run ios`, `npm run web`, `npm run lint`
- Env vars: Copy `.env.example` to `.env` (`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID`).
- Mock API: `USE_MOCK_API` (`src/core/api/mock.ts`) is derived from `EXPO_PUBLIC_DEV_WEB_PREVIEW=1`, the dev-only preview flag that also stubs Firebase auth (`src/core/auth/AuthContext.tsx`) so the app gets past the auth guard with no backend and no real account. Guarded by `__DEV__`, so it cannot reach a release build. Works on the emulator as well as `npm run web`.

**RUN IT ON THE EMULATOR — this is not optional for UI work.**

An Android emulator is set up and working. `./scripts/emulator.sh preview` boots it, starts Metro
with the auth stub and mock data, and launches the app; `./scripts/emulator.sh shot` writes
`.emulator-shot.png` for you to look at. Drive the UI with `adb shell input tap/text/swipe`, jump
straight to a screen with the `rentcontrol://` deep link, and read the real accessibility tree
(labels, touch-target sizes in dp) with `adb shell uiautomator dump`.

**Any change that affects what the user sees must be checked there before you call it done** —
layout, spacing, keyboard behaviour, safe areas, RTL, font scaling, navigation. The web preview
(`npm run web`) does not match native rendering and will hide real bugs: a review of the Chat tab
found the Android keyboard completely covering the composer, and RTL list bullets on the wrong
side, neither of which is visible in a browser. Reach for the emulator by default on UI work
rather than waiting to be asked.

Notes that will otherwise cost you an hour: Metro runs on **8083** (a WSL `netsh portproxy` hijacks
8081 and 8082), the device reaches it at **10.0.2.2**, not `localhost`. The script pre-builds the
bundle because a cold Metro takes ~1 min and the dev client's read timeout is shorter — without it
the first launch dies in an unrelated-looking Java stack trace. If Metro starts returning 500s or
you see `fork: Resource temporarily unavailable`, restart Metro; that is host process exhaustion,
not an app bug.

**Directories & Aliases:**

- `app/`: Expo Router routes. `(tabs)/` is a 5-tab shell (Home, Properties, Renters, Transactions, Chat); `(auth)/` is sign-in. **Settings is not a tab** — it lives at `app/settings/`, outside the tab navigator, reached from the `SettingsGearButton` in each tab header, and carries its own auth guard. Root layouts hold providers.
- `src/core/`: Axios, theme, i18n, core contexts.
- `src/features/`: Feature slices (home, properties, renters, transactions, suppliers, reports, notifications, settings, legal, document-scan, agent). `legal/` holds the Privacy Policy, Terms and Accessibility Statement, reached from Settings; its `legalContent.ts` is a **duplicate** of the web app's copy and must be edited in both repos together. `agent/` is the "Ask Rent Control" assistant — SSE streaming against `POST /agent/chat`, read-only.
- `@/*` resolves to repo root. All imports must use `@/src/...` (no relative `../`).

**ROUTING INSTRUCTIONS:**
Before creating, modifying, or debugging any core logic (State, API, Forms, Navigation, i18n/RTL, or Theming), you MUST read `.claude/docs/architectural_patterns.md` first.
