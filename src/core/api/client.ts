import axios from 'axios';
import Constants from 'expo-constants';

const baseURL =
  Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8000';

// TODO: Add Authorization: `Bearer ${token}` header when real auth is implemented
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

// Request interceptor - log outgoing requests in dev
apiClient.interceptors.request.use(
  (config) => {
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

/** Get user-friendly error message from API or other errors */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const withUserMessage = err as Error & { userMessage?: string };
  if (withUserMessage?.userMessage) return withUserMessage.userMessage;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
