/**
 * Onboarding — gate resolvers (mobile).
 *
 * A tour whose gate is false is *not* consumed: it defers to the next visit. This is what
 * replaces a per-session cap — a curious user is never throttled for exploring, and a
 * tour is only ever spent where it has something to say.
 *
 * Emptiness is no longer one of those gates. The list tours used to be held shut until
 * their screen had rows on it, which meant the person the tour was written for — someone
 * who has just signed up and has nothing anywhere — was the only person who never saw it.
 * They run on an empty screen now, and the handful of steps that genuinely need content
 * to point at drop themselves through `skipWhen: 'noProperties'` and its siblings.
 *
 * `loading` matters as much as the answer: while the underlying lists are still in
 * flight, every gate reports false, so a tour cannot fire against a list that merely
 * looks empty.
 */
import { useCallback } from 'react';
import { usePropertyContext, useRenterContext } from '@/src/context';
import { useCountry } from '@/src/features/country/CountryContext';
import type { CapabilityName, GateId } from './types';

/** How many items a list needs before the bulk-select hint is worth showing. */
export const BULK_SELECT_MIN_ITEMS = 3;

export interface GateInputs {
  /** Set by the lease form while the user has CPI / Custom selected. */
  rentMode?: string | null;
}

/**
 * Whether a gate can be answered *at all* yet, as opposed to what the answer is.
 *
 * `useGates` folds "still loading" into `false`, which is the safe direction for a tour: an
 * unanswerable gate defers it. `skipWhen` inverts that — false means "keep the step" — so
 * a tour opening before the lists load would show the closing "start with one property"
 * card to someone with a full portfolio. The controller waits on this instead, within the
 * same anchor deadline.
 */
export function useGateKnown() {
  const { loading: propertiesLoading } = usePropertyContext();
  const { loading: rentersLoading } = useRenterContext();

  return useCallback(
    (gate: GateId): boolean => {
      switch (gate) {
        case 'hasProperties':
        case 'noProperties':
          return !propertiesLoading;
        case 'hasRenters':
        case 'noRenters':
        case 'hasTransactions':
        case 'noTransactions':
          return !rentersLoading;
        case 'listHasThreeItems':
          return !propertiesLoading && !rentersLoading;
        // `always` and the rent-mode gates read no server data — they are always answerable.
        default:
          return true;
      }
    },
    [propertiesLoading, rentersLoading],
  );
}

export function useGates() {
  const { properties, loading: propertiesLoading } = usePropertyContext();
  const { renters, loading: rentersLoading } = useRenterContext();

  const loading = propertiesLoading || rentersLoading;

  return useCallback(
    (gate: GateId, inputs: GateInputs = {}): boolean => {
      // Never answer from a list that has not loaded — an empty array during the first
      // fetch is indistinguishable from a genuinely empty portfolio.
      if (loading) return false;

      switch (gate) {
        case 'always':
          return true;
        case 'hasProperties':
          return properties.length > 0;
        case 'hasRenters':
          return renters.length > 0;
        case 'hasTransactions':
          // Transactions are paginated and not cheap to count here. A portfolio with
          // renters is the honest proxy: it is the point at which money starts moving.
          return renters.length > 0;
        // The negations, for `skipWhen`. The `loading` guard above already keeps these
        // from answering "empty" while the lists are still in flight, which is the one
        // way they could drop a step from an account that has plenty.
        case 'noProperties':
          return properties.length === 0;
        case 'noRenters':
        case 'noTransactions':
          return renters.length === 0;
        case 'listHasThreeItems':
          return (
            properties.length >= BULK_SELECT_MIN_ITEMS || renters.length >= BULK_SELECT_MIN_ITEMS
          );
        case 'cpiSelected':
          return inputs.rentMode === 'cpi';
        case 'customSelected':
          return inputs.rentMode === 'custom';
        default:
          return false;
      }
    },
    [loading, properties.length, renters.length],
  );
}

/**
 * Whether the account's country actually has a capability a step or seed depends on.
 *
 * Separate from `useGates` because it answers a different kind of question — `GateId` asks
 * about the account's *data*, this asks what the product even offers here — and because it
 * reads the **reactive** country context rather than `capabilities()` in
 * `shared/utils/capabilities.ts`. That module is plain module state: reading it would never
 * invalidate this callback, which is the controller's retry mechanism, and its default is
 * Israel's full set, so a tour opening before the config landed would be told CPI exists
 * and would show a seed advertising a control that is not on the screen.
 *
 * `CountryProvider` wraps `TourControllerProvider` in `app/_layout.tsx`, so this is always
 * inside the provider.
 */
export function useCapability() {
  const { config } = useCountry();
  return useCallback(
    (requires: CapabilityName | undefined): boolean => {
      if (!requires) return true;
      return config?.capabilities?.[requires] === true;
    },
    [config],
  );
}

/**
 * Whether the capability question can be answered yet, as opposed to what the answer is.
 *
 * The mirror of `useGateKnown`, and needed for the same reason: an unanswerable capability
 * must hold the tour rather than resolve to the permissive default.
 */
export function useCapabilityKnown(): boolean {
  const { config } = useCountry();
  return config !== undefined;
}
