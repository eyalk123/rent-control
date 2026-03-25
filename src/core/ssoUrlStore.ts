/**
 * Captures SSO callback data before Expo Router's native deep-link handler can strip it.
 *
 * Two capture paths:
 *  1. _layout.tsx → Linking.addEventListener fires → set(url) stores the full URL
 *  2. sign-in.tsx → openAuthSessionAsync returns 'success' → setNonce() stores nonce directly
 *
 * sso-callback.tsx calls getNonce() which checks both sources.
 */

let _url: string | null = null;
let _nonce: string | null = null;

export const ssoUrlStore = {
  // ── URL path (used by _layout.tsx Linking listener) ──────────────────────
  set(url: string) { _url = url; },
  get(): string | null { return _url; },
  clear() { _url = null; },

  // ── Nonce path (used by sign-in.tsx after openAuthSessionAsync) ───────────
  setNonce(nonce: string | null) { _nonce = nonce; },

  // ── Unified getter used by sso-callback.tsx ───────────────────────────────
  /** Returns the nonce from either source, whichever is available first. */
  getNonce(): string | null {
    if (_nonce) return _nonce;
    if (_url) {
      try { return new URL(_url).searchParams.get('rotating_token_nonce'); } catch { /* ignore */ }
    }
    return null;
  },

  clearAll() { _url = null; _nonce = null; },
};
