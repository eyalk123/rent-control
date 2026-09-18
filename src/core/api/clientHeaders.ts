import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Telemetry headers identifying this client to the backend.
 *
 * The product ships two clients — this one and the React web app — against one backend,
 * and until these headers existed both sent only `Content-Type` and `Authorization`, so
 * every request looked identical to the server. There was no way to tell where owners
 * actually work, and therefore no evidence on which to split engineering effort between
 * the two. The backend accumulates them into `owner_client_days`.
 *
 * **`app` is always `'mobile'`, including in the browser preview.** `app` names the
 * product; `platform` names the OS it happens to be running on. They are two headers
 * precisely because this app can run in a browser — `EXPO_PUBLIC_DEV_WEB_PREVIEW=1`, where
 * `Platform.OS === 'web'` — and reporting that as the web app would merge it with the real
 * web client and produce the exact opposite of the answer the measurement exists to give.
 * Do not derive `app` from `Platform.OS`.
 *
 * Anything the backend does not recognise is stored as `"unknown"` rather than rejected,
 * so a bad value here degrades the data — it never fails a request.
 *
 * Kept in its own module because two things send requests: the Axios instance in
 * `client.ts`, and `features/agent/api/agentStream.ts`, which uses `expo/fetch` because
 * Axios cannot stream. Sending an agent message is counted as real work, so the streaming
 * call has to carry these too or that work is attributed to no client at all.
 */
export const CLIENT_HEADERS: Record<string, string> = {
  'X-Client-App': 'mobile',
  // ios | android | web. Any other value the backend does not know becomes "unknown".
  'X-Client-Platform': Platform.OS,
  // The store version from app.json (via app.config.js) — the same string a release is
  // identified by, so "who is still on the old build?" is answerable without a second
  // version mechanism.
  ...(Constants.expoConfig?.version ? { 'X-Client-Version': Constants.expoConfig.version } : {}),
};
