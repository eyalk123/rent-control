/**
 * Onboarding — the tour controller (mobile).
 *
 * Owns *which* tour is running and *where* in it we are. It renders no UI; TourOverlay
 * draws whatever this exposes. Keeping the two apart is what lets the web app reuse this
 * logic with a Radix-based renderer in Phase 5.
 *
 * A tour opens only when all of these hold:
 *   1. tour state has loaded (never guess and replay something already dismissed);
 *   2. tours are not disabled;
 *   3. this tour has not been seen;
 *   4. its gate passes — see useGates for why a failing gate defers rather than consumes;
 *   5. every anchored step it needs is actually mounted and measurable.
 *
 * (5) is the one that is easy to forget: a screen mounts its header before its list, so
 * asking too early points the spotlight at nothing.
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
import { InteractionManager } from 'react-native';
import { useAnchorRegistry } from './AnchorRegistry';
import { TOURS } from './registry';
import { useGates, type GateInputs } from './useGates';
import { useTourState } from './TourStateContext';
import type { SeedId, TourDefinition, TourId, TourStep } from './types';

/** How long to wait for a screen's anchors to mount before giving up on this visit. */
const ANCHOR_WAIT_MS = 1200;
const ANCHOR_POLL_MS = 120;

interface ActiveTour {
  tour: TourDefinition;
  stepIndex: number;
  /** Set when the tour was opened by acting on a seed — drives the callback line. */
  arrivedFrom: SeedId | null;
}

interface TourControllerValue {
  active: ActiveTour | null;
  step: TourStep | null;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  back: () => void;
  skip: () => void;
  /**
   * Asks for a tour. Safe to call on every render of a screen — it self-suppresses once
   * the tour has run, is running, or has already been declined this session.
   */
  requestTour: (id: TourId, inputs?: GateInputs) => void;
}

const TourControllerContext = createContext<TourControllerValue | null>(null);

export function TourControllerProvider({ children }: PropsWithChildren) {
  const registry = useAnchorRegistry();
  const tourState = useTourState();
  const evaluateGate = useGates();
  const [active, setActive] = useState<ActiveTour | null>(null);
  // Tours already considered and rejected this session, so a screen that re-renders
  // constantly does not re-run the whole check each time.
  const declined = useRef(new Set<TourId>());
  const openingRef = useRef<TourId | null>(null);

  const canRun = Boolean(tourState?.ready) && !tourState?.state.toursDisabled;

  /** Waits for the anchors a tour needs, then opens it. */
  const openWhenAnchored = useCallback(
    async (tour: TourDefinition, arrivedFrom: SeedId | null) => {
      const needed = tour.steps.map((s) => s.anchor).filter((a): a is string => Boolean(a));
      const deadline = Date.now() + ANCHOR_WAIT_MS;

      // Let the screen finish its entrance animation first; measuring mid-transition
      // gives a rect that is about to be wrong.
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => resolve());
      });

      while (Date.now() < deadline) {
        const ready = needed.every((key) => registry?.has(key));
        if (ready) {
          setActive({ tour, stepIndex: 0, arrivedFrom });
          openingRef.current = null;
          return;
        }
        await new Promise((r) => setTimeout(r, ANCHOR_POLL_MS));
      }

      // Never mounted in time. Leave the tour unseen so it gets another chance on the
      // next visit rather than being silently burned.
      openingRef.current = null;
    },
    [registry],
  );

  const requestTour = useCallback(
    (id: TourId, inputs: GateInputs = {}) => {
      if (!canRun || active || openingRef.current) return;
      if (declined.current.has(id)) return;

      const tour = (TOURS as Partial<Record<TourId, TourDefinition>>)[id];
      if (!tour) return;
      if (tourState?.hasSeenTour(id)) return;

      if (!evaluateGate(tour.gate, inputs)) {
        // Gate failed: do NOT mark declined — the whole point is that it retries once the
        // screen has something worth explaining.
        return;
      }

      openingRef.current = id;
      const arrivedFrom =
        tour.arrivesFrom && tourState?.hasShownSeed(tour.arrivesFrom) ? tour.arrivesFrom : null;
      void openWhenAnchored(tour, arrivedFrom);
    },
    [canRun, active, tourState, evaluateGate, openWhenAnchored],
  );

  const finish = useCallback(
    (tour: TourDefinition) => {
      tourState?.markTourSeen(tour.id);
      // Every seed the user actually saw is recorded, so the destination tour can open
      // with its callback line later — and so a seed is never shown twice.
      tour.steps.forEach((s) => {
        if (s.seed) tourState?.markSeedShown(s.seed.id);
      });
      setActive(null);
    },
    [tourState],
  );

  const next = useCallback(() => {
    setActive((prev) => {
      if (!prev) return null;
      if (prev.stepIndex >= prev.tour.steps.length - 1) {
        finish(prev.tour);
        return null;
      }
      return { ...prev, stepIndex: prev.stepIndex + 1 };
    });
  }, [finish]);

  const back = useCallback(() => {
    setActive((prev) =>
      prev && prev.stepIndex > 0 ? { ...prev, stepIndex: prev.stepIndex - 1 } : prev,
    );
  }, []);

  const skip = useCallback(() => {
    setActive((prev) => {
      if (!prev) return null;
      // Skipping still counts as seen. Re-offering a tour someone actively dismissed is
      // the fastest way to make the whole feature feel like nagging.
      finish(prev.tour);
      declined.current.add(prev.tour.id);
      return null;
    });
  }, [finish]);

  // A tour must not outlive a sign-out.
  useEffect(() => {
    if (!canRun) {
      setActive(null);
      openingRef.current = null;
    }
  }, [canRun]);

  const value = useMemo<TourControllerValue>(() => {
    const step = active ? active.tour.steps[active.stepIndex] : null;
    return {
      active,
      step,
      isFirst: active ? active.stepIndex === 0 : false,
      isLast: active ? active.stepIndex === active.tour.steps.length - 1 : false,
      next,
      back,
      skip,
      requestTour,
    };
  }, [active, next, back, skip, requestTour]);

  return (
    <TourControllerContext.Provider value={value}>{children}</TourControllerContext.Provider>
  );
}

export function useTourController(): TourControllerValue | null {
  return useContext(TourControllerContext);
}

/**
 * Screen-level entry point: asks for a tour whenever the screen is mounted and its inputs
 * change. Suppression lives in the controller, so calling this unconditionally is correct.
 *
 *   useTour('transactions-list');
 */
export function useTour(id: TourId, inputs: GateInputs = {}) {
  const controller = useTourController();
  const request = controller?.requestTour;
  const rentMode = inputs.rentMode ?? null;

  useEffect(() => {
    if (!request) return;
    request(id, { rentMode });
  }, [request, id, rentMode]);
}
