import axios from 'axios';
import Constants from 'expo-constants';
// The i18next instance, not the hook — this module is not a component, and every screen's
// error message funnels through getApiErrorMessage below. Initialised as an import side
// effect by src/core/i18n, which the root layout imports before anything can call an API.
import i18n from 'i18next';

const baseURL =
  Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug: log base URL on init (helps verify .env is loaded)
if (__DEV__) {
  console.log('[API] Base URL:', baseURL);
}

// Auth token getter — set by AuthTokenSync inside the React tree (has access to useAuth)
let _getToken: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

// Connectivity getter — set by NetworkProvider, same shape as the token getter above.
let _isOffline: (() => boolean) | null = null;

export function setOfflineChecker(fn: () => boolean) {
  _isOffline = fn;
}

/** Marks the rejection we raise ourselves when the device has no connection. */
export const OFFLINE_ERROR_CODE = 'ERR_OFFLINE';

/**
 * True for "the request never reached the server": no connection, DNS/socket failure, or a
 * timeout. Distinguished from a real HTTP response, which always has `err.response`.
 */
export function isNetworkError(err: unknown): boolean {
  const e = err as { code?: string; response?: unknown };
  if (!e || typeof e !== 'object') return false;
  if (e.response) return false;
  return e.code === OFFLINE_ERROR_CODE || e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED';
}

// Request interceptor — attach Bearer token and log in dev
apiClient.interceptors.request.use(
  async (config) => {
    // Fail fast when there is no connection, *before* touching the token. Two reasons:
    // the ~9 requests this app fires on launch would otherwise each burn the full 10s
    // timeout, and getIdToken() rejects offline once the cached token is over an hour old,
    // which would surface as an auth failure rather than the connectivity problem it is.
    if (_isOffline?.()) {
      const err = new Error('Device is offline') as Error & { code?: string };
      err.code = OFFLINE_ERROR_CODE;
      return Promise.reject(err);
    }
    if (_getToken) {
      const token = await _getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (__DEV__) {
      console.log('[API]', config.method?.toUpperCase(), (config.baseURL ?? '') + (config.url ?? ''));
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Helper to extract user-friendly message from API error
function getDetailMessage(detail: unknown): string | null {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail
      .filter((x): x is { msg?: string } => typeof x === 'object' && x != null)
      .map((x) => x.msg ?? JSON.stringify(x));
    return parts.length > 0 ? parts.join('; ') : null;
  }
  return null;
}

// Response interceptor - map backend detail to userMessage, log in dev
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail;
    const userMessage = getDetailMessage(detail);
    if (userMessage) {
      (error as Error & { userMessage?: string }).userMessage = userMessage;
    }
    if (__DEV__) {
      const msg = error.message || 'Unknown error';
      const code = error.code;
      const status = error.response?.status;
      const data = error.response?.data;
      console.warn(
        '[API Error]',
        { message: msg, userMessage, code, status, data, url: error.config?.url }
      );
    }
    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * Get user-friendly error message from API or other errors.
 *
 * Connectivity is checked before anything else: axios reports a dropped connection as the
 * literal English string "Network Error", which the old `err.message` fallback rendered
 * verbatim inside the Hebrew UI. Every screen reaches its error text through this one
 * function, so translating here fixes all of them at once.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isNetworkError(err)) {
    const code = (err as { code?: string }).code;
    return code === 'ECONNABORTED' ? i18n.t('error.timeout') : i18n.t('error.offline');
  }
  const withUserMessage = err as Error & { userMessage?: string };
  if (withUserMessage?.userMessage) return withUserMessage.userMessage;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
