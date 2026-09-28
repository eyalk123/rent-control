/**
 * Legal consent — which documents this account still owes acceptance of (mobile).
 *
 * The web app holds this in React Query; mobile has no query layer, so it lives in a
 * context alongside the app's other providers. Same endpoint, same comparison.
 *
 * Cached in AsyncStorage as well as fetched, so a returning user who has already accepted
 * does not get a blocking screen flashed at them on every cold start while the network
 * call is in flight.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import {
  EMPTY_LEGAL_STATUS,
  getLegalStatus,
  outstandingDocuments,
  postLegalAcceptance,
  type LegalDocument,
  type LegalStatus,
} from './api/legalAcceptance';
import { AI_CONSENT_VERSION } from './aiConsent';

/**
 * Account-scoped, so it is cleared on sign-out and on account deletion — the same two
 * paths that clear TOUR_STATE_CACHE_KEY, and for the same reason: leaving it on the device
 * hands one account's record to whoever signs in next.
 */
export const LEGAL_CONSENT_CACHE_KEY = 'legal.consent.v1';

interface LegalConsentValue {
  /** Documents this build must have accepted before the app may be used. */
  outstanding: LegalDocument[];
  /** Whether the consent gate should be covering the app right now. */
  blocked: boolean;
  accept: () => Promise<void>;
  /**
   * Resolves true once the user has allowed sending data to Anthropic — immediately if they
   * already have, otherwise after they answer the prompt. Call it before any lease scan or
   * assistant message; false means send nothing.
   */
  requestAiConsent: () => Promise<boolean>;
  /** Whether the AI consent prompt is showing (read by AiConsentSheet). */
  aiPromptOpen: boolean;
  /** The prompt's answer. Allowing records it on the account first and throws if that fails. */
  answerAiPrompt: (allow: boolean) => Promise<void>;
}

const LegalConsentContext = createContext<LegalConsentValue | null>(null);

export function LegalConsentProvider({ children }: PropsWithChildren) {
  const { isSignedIn, isLoaded } = useAppAuth();
  const [status, setStatus] = useState<LegalStatus>(EMPTY_LEGAL_STATUS);
  // Nothing blocks until the server has actually said so. This is the fail-open switch:
  // a slow or broken endpoint leaves `checked` false and the app usable, and the question
  // gets asked again next launch. Only an explicit "you have not accepted" gates anyone.
  const [checked, setChecked] = useState(false);

  // Hydrate from cache first so an already-accepted user never sees the gate flash.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(LEGAL_CONSENT_CACHE_KEY);
        if (cached && !cancelled) {
          setStatus(JSON.parse(cached) as LegalStatus);
          setChecked(true);
        }
      } catch {
        // A cache miss or a corrupt blob is not worth surfacing; the server is the truth.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Signing out drops the cache — see the note on the key. Gated on `isLoaded` because
  // Firebase reports "signed out" while it is still restoring the session, and clearing on
  // that would wipe the record of the user who is about to be restored.
  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    setStatus(EMPTY_LEGAL_STATUS);
    setChecked(false);
    AsyncStorage.removeItem(LEGAL_CONSENT_CACHE_KEY).catch(() => {});
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const server = await getLegalStatus();
        if (cancelled) return;
        setStatus(server);
        setChecked(true);
        AsyncStorage.setItem(LEGAL_CONSENT_CACHE_KEY, JSON.stringify(server)).catch(() => {});
      } catch {
        // Offline, or the endpoint is down. Keep whatever the cache gave us rather than
        // locking someone out of their own portfolio over a request that failed.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const outstanding = useMemo(() => outstandingDocuments(status), [status]);

  const aiConsented = status.ai_processing?.version === AI_CONSENT_VERSION;
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const aiResolverRef = useRef<((allowed: boolean) => void) | null>(null);

  const requestAiConsent = useCallback((): Promise<boolean> => {
    if (aiConsented) return Promise.resolve(true);
    // A second request while the prompt is up (a double tap) gets its own answer rather
    // than orphaning the first caller's promise.
    aiResolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      aiResolverRef.current = resolve;
      setAiPromptOpen(true);
    });
  }, [aiConsented]);

  const answerAiPrompt = useCallback(async (allow: boolean) => {
    if (allow) {
      // Recorded before anything is sent: if the write fails, the caller shows an error and
      // the prompt stays open, so nothing reaches Anthropic without a stored permission.
      const server = await postLegalAcceptance(['ai_processing']);
      if (server) {
        setStatus(server);
        AsyncStorage.setItem(LEGAL_CONSENT_CACHE_KEY, JSON.stringify(server)).catch(() => {});
      }
    }
    setAiPromptOpen(false);
    aiResolverRef.current?.(allow);
    aiResolverRef.current = null;
  }, []);

  const accept = useCallback(async () => {
    const server = await postLegalAcceptance(outstanding);
    if (!server) return;
    setStatus(server);
    setChecked(true);
    AsyncStorage.setItem(LEGAL_CONSENT_CACHE_KEY, JSON.stringify(server)).catch(() => {});
  }, [outstanding]);

  const value = useMemo(
    () => ({
      outstanding,
      blocked: isSignedIn && checked && outstanding.length > 0,
      accept,
      requestAiConsent,
      aiPromptOpen,
      answerAiPrompt,
    }),
    [isSignedIn, checked, outstanding, accept, requestAiConsent, aiPromptOpen, answerAiPrompt],
  );

  return <LegalConsentContext.Provider value={value}>{children}</LegalConsentContext.Provider>;
}

export function useLegalConsent(): LegalConsentValue {
  const ctx = useContext(LegalConsentContext);
  if (!ctx) throw new Error('useLegalConsent must be used within a LegalConsentProvider');
  return ctx;
}
