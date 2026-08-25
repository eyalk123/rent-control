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
8081 and 8082). The device reaches Metro over **`adb reverse` + `localhost`**, which the script
sets up for you — *not* `10.0.2.2`. Over 10.0.2.2 the emulator's NAT corrupts the 21MB multipart
bundle stream and the app hangs on "Bundling 100.0%" forever with
`ProtocolException: Expected leading [0-9a-fA-F] character` in logcat; only 8081/8082 still need
10.0.2.2, because the portproxy owns localhost there. The script pre-builds the bundle because a
cold Metro takes ~1 min and the dev client's read timeout is shorter — without it the first launch
dies in an unrelated-looking Java stack trace. If Metro starts returning 500s, or `expo-updates`
subprocesses exit `0xC0000142`, or you see `fork: Resource temporarily unavailable`, restart Metro;
that is host process exhaustion, not an app bug.

**Running more than one agent on emulators — read before booting a second one.**

Each agent gets its own emulator and its own Metro. Second agent:

```
AVD=rent_control_dev2 EMU_PORT=5556 PORT=8084 ./scripts/emulator.sh preview
```

`./scripts/emulator.sh ps` shows what is already running and how much RAM is left; **run it before
booting anything.** `EMU_PORT=<port> ./scripts/emulator.sh stop` shuts your instance down.

**Cap: 2 emulators. Do not start a third without asking the user first.** Measured on this
machine (32G): one emulator takes ~5.4G, two take **8.6G before the app even loads**, which leaves
under 2G free — already into swapping. A third only fits if the user closes Chrome and other apps,
and that is their call, not yours. If you need a third, say so and let them decide; if `ps` shows
two already up and you are not one of them, stop and tell the user rather than booting another.

Existing AVDs are `rent_control_dev` (8083/5554) and `rent_control_dev2` (8084/5556) — one AVD per
running instance, they cannot be shared (`-read-only` only works if *every* instance uses it, and
then none of them persist their app install).

**Clean up after yourself.** If you booted an emulator that was not already running, `stop` it when
you finish. Leave a pre-existing one alone — the user may be using it, and a cold boot costs ~90s.
Two other things that are not automatic: `build` must not run in two agents at once from this
checkout (Gradle locks the build dir — build once, then `adb install -r` per emulator with
`ANDROID_SERIAL` set), and each Metro needs its own transform cache, which the script handles by
scoping `TMPDIR` per port; two bundlers sharing one cache silently serve a **1-module** bundle.

**Directories & Aliases:**

- `app/`: Expo Router routes. `(tabs)/` is a 5-tab shell (Home, Properties, Renters, Transactions, Chat); `(auth)/` is sign-in. **Settings is not a tab** — it lives at `app/settings/`, outside the tab navigator, reached from the `SettingsGearButton` in each tab header, and carries its own auth guard. Root layouts hold providers.
- `src/core/`: Axios, theme, i18n, core contexts.
- `src/features/`: Feature slices (home, properties, renters, transactions, suppliers, reports, notifications, settings, legal, document-scan, agent). `legal/` holds the Privacy Policy, Terms and Accessibility Statement, reached from Settings; its `legalContent.ts` is a **duplicate** of the web app's copy and must be edited in both repos together. `agent/` is the "Ask Rent Control" assistant — SSE streaming against `POST /agent/chat`, read-only. `onboarding/` is the guided tour: `registry.ts` holds the tour/step structure (copy lives in i18n under `onboarding.*`), `types.ts` is byte-identical to the web repo's so both platforms share tour and seed IDs, and progress is stored per account (`/users/me/tour-state`) so a tour seen in the browser does not reappear here. **The content is unfinished, so `flags.ts` keeps it off by default: on under `__DEV__` and in the `preview`/`simulator` EAS profiles, off in release builds unless `EXPO_PUBLIC_ONBOARDING_TOURS=on`.**
- `@/*` resolves to repo root. All imports must use `@/src/...` (no relative `../`).

**ROUTING INSTRUCTIONS:**
Before creating, modifying, or debugging any core logic (State, API, Forms, Navigation, i18n/RTL, or Theming), you MUST read `.claude/docs/architectural_patterns.md` first.
