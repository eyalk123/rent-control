/**
 * Onboarding — gate resolvers (mobile).
 *
 * A tour whose gate is false is *not* consumed: it defers to the next visit. This is what
 * replaces a per-session cap. An irrelevant tour never fires — landing on Transactions
 * with no properties yet teaches nothing — so a curious user is never throttled for
 * exploring, and a tour is only ever spent on a screen that has something to explain.
 *
 * `loading` matters as much as the answer: while the underlying lists are still in
 * flight, every gate reports false, so a tour cannot fire against a list that merely
 * looks empty.
 */
import { useCallback } from 'react';
import { usePropertyContext, useRenterContext } from '@/src/context';
import type { GateId } from './types';

/** How many items a list needs before the bulk-select hint is worth showing. */
export const BULK_SELECT_MIN_ITEMS = 3;

export interface GateInputs {
  /** Set by the lease form while the user has CPI / Custom selected. */
  rentMode?: string | null;
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
