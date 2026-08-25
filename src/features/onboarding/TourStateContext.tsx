/**
 * Onboarding — tour state (mobile).
 *
 * The web app holds this in React Query; mobile has no query layer, so it lives in a
 * context alongside the app's other providers. Same server endpoint, same merge
 * semantics, same two-map shape.
 *
 * Progress is cached in AsyncStorage as well as fetched, so a cold start does not show a
 * tour the user already finished while the network call is still in flight — which is the
 * one failure mode that would actively annoy a returning user.
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
import { TOURS_ENABLED } from './flags';
import {
  EMPTY_TOUR_STATE,
  getTourState,
  patchTourState,
  type TourState,
  type TourStatePatch,
} from './api/tourState';
import type { SeedId, TourId } from './types';

const CACHE_KEY = 'onboarding.tourState.v1';

interface TourStateValue {
  state: TourState;
  /** Until this is true, no tour may run — better silent than repeated. */
  ready: boolean;
  hasSeenTour: (id: TourId) => boolean;
  hasShownSeed: (id: SeedId) => boolean;
  markTourSeen: (id: TourId) => void;
  markSeedShown: (id: SeedId) => void;
  setToursDisabled: (disabled: boolean) => void;
  resetTours: () => void;
}

const TourStateContext = createContext<TourStateValue | null>(null);

export function TourStateProvider({ children }: PropsWithChildren) {
  const { isSignedIn } = useAppAuth();
  const [state, setState] = useState<TourState>(EMPTY_TOUR_STATE);
  const [ready, setReady] = useState(false);
  // Coalesces the burst of marks a finishing tour produces into one request.
  const pending = useRef<{ tours: Set<TourId>; seeds: Set<SeedId> }>({
    tours: new Set(),
    seeds: new Set(),
  });
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from cache first so a returning user never sees a finished tour again while
  // the network call is still going.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && !cancelled) setState(JSON.parse(cached) as TourState);
      } catch {
        // A cache miss or a corrupt blob is not worth surfacing; the server is the truth.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // With the master switch off, never ask the server for tour state: a build with tours
    // disabled makes no onboarding request at all. `ready` stays false, which on its own
    // keeps every tour shut.
    if (!TOURS_ENABLED || !isSignedIn) {
      setReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const server = await getTourState();
        if (cancelled) return;
        setState(server);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(server)).catch(() => {});
      } catch {
        // Offline or a failing endpoint must not replay tours the user already dismissed,
        // so we stay on whatever the cache gave us and simply never open a new one.
        if (!cancelled) setReady(false);
        return;
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const flush = useCallback(() => {
    const tours = [...pending.current.tours];
    const seeds = [...pending.current.seeds];
    pending.current = { tours: new Set(), seeds: new Set() };
    if (!tours.length && !seeds.length) return;
    patchTourState({ toursSeen: tours, seedsShown: seeds })
      .then((server) => {
        if (!server) return; // no server (preview/mock) — keep the optimistic state
        setState(server);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(server)).catch(() => {});
      })
      .catch(() => {
        // Deliberately not rolled back: a lost write means the tour may appear once more
        // on another device, which is far better than replaying it here immediately.
      });
  }, []);

  const schedule = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(flush, 400);
  }, [flush]);

  useEffect(
    () => () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
    },
    [],
  );

  const applyLocal = useCallback((patch: TourStatePatch) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const next: TourState = {
        toursSeen: { ...prev.toursSeen },
        seedsShown: { ...prev.seedsShown },
        toursDisabled: patch.toursDisabled ?? prev.toursDisabled,
      };
      if (patch.reset) {
        next.toursSeen = {};
        next.seedsShown = {};
      }
      // First sighting wins, matching the server.
      patch.toursSeen?.forEach((id) => {
        next.toursSeen[id] ??= now;
      });
      patch.seedsShown?.forEach((id) => {
        next.seedsShown[id] ??= now;
      });
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const markTourSeen = useCallback(
    (id: TourId) => {
      applyLocal({ toursSeen: [id] });
      pending.current.tours.add(id);
      schedule();
    },
    [applyLocal, schedule],
  );

  const markSeedShown = useCallback(
    (id: SeedId) => {
      applyLocal({ seedsShown: [id] });
      pending.current.seeds.add(id);
      schedule();
    },
    [applyLocal, schedule],
  );

  const setToursDisabled = useCallback(
    (disabled: boolean) => {
      applyLocal({ toursDisabled: disabled });
      patchTourState({ toursDisabled: disabled }).catch(() => {});
    },
    [applyLocal],
  );

  const resetTours = useCallback(() => {
    applyLocal({ reset: true });
    patchTourState({ reset: true })
      .then((server) => {
        if (server) setState(server);
      })
      .catch(() => {});
  }, [applyLocal]);

  const value = useMemo<TourStateValue>(
    () => ({
      state,
      ready,
      hasSeenTour: (id) => Boolean(state.toursSeen[id]),
      hasShownSeed: (id) => Boolean(state.seedsShown[id]),
      markTourSeen,
      markSeedShown,
      setToursDisabled,
      resetTours,
    }),
    [state, ready, markTourSeen, markSeedShown, setToursDisabled, resetTours],
  );

  return <TourStateContext.Provider value={value}>{children}</TourStateContext.Provider>;
}

/** Null outside the provider rather than throwing — a screen rendered in isolation
 *  (a test, a preview) must not crash because onboarding is absent. */
export function useTourState(): TourStateValue | null {
  return useContext(TourStateContext);
}
