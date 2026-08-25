/**
 * Onboarding — the master switch.
 *
 * The tour content is roughly half written, and `main` ships, so the default has to be
 * "off unless someone deliberately asked for it". A partly finished tour is worse than no
 * tour: it points at controls it never explains and then burns its own "seen" mark on the
 * account, so the finished version never gets shown to that user at all.
 *
 * Precedence, highest first:
 *
 *   1. `EXPO_PUBLIC_ONBOARDING_TOURS` (`on` / `off`) — set it in `.env` for a local run,
 *      or in an `eas.json` build profile's `env` block. The `preview` and `simulator`
 *      profiles set it to `on`, so an internal build can be used to test the tours; the
 *      `production` profile deliberately does not.
 *   2. Otherwise: `__DEV__`, i.e. on when running the dev bundle (`npx expo start`,
 *      emulator, dev client) and off in any release build.
 *
 * The web app has the same switch and the same defaults — see the web repo's
 * `features/onboarding/flags.ts`. It also carries a per-browser localStorage override,
 * which has no useful mobile equivalent: there is no console to type into on a phone,
 * and rebuilding with the env var set is the same amount of work as anything else.
 *
 * If the tours ever need a real remote kill switch, that is the account-level
 * `toursDisabled` flag the server already stores, not this.
 */

function readFlag(raw: string | undefined): boolean | null {
  if (raw === 'on' || raw === 'true' || raw === '1') return true;
  if (raw === 'off' || raw === 'false' || raw === '0') return false;
  return null;
}

const fromEnv = readFlag(process.env.EXPO_PUBLIC_ONBOARDING_TOURS);

/**
 * Whether the guided tours may run at all. When false nothing about onboarding happens:
 * no tour state is fetched, no tour opens, no overlay is drawn. Anchors stay registered —
 * they cost a ref callback each and keep the call sites honest while the content is being
 * written.
 */
export const TOURS_ENABLED = fromEnv ?? __DEV__;
