import type { LeaseYear, LeaseYearType, RentEscalationMode } from "@/src/shared/types";

/**
 * Lease schedule helpers.
 *
 * The renter form lets the user express lease terms as *intent* — a contract
 * term, optional renewal years, a first-year rent and an escalation rule — and
 * materializes that intent into the canonical `lease_years: { amount, type }[]`
 * array the rest of the app consumes. These pure helpers do that translation in
 * both directions so the builder UI and the edit-hydration path share one
 * source of truth.
 */

export type { RentEscalationMode } from "@/src/shared/types";

export interface LeaseScheduleInput {
  /** Number of binding (contract) years — always first in the schedule. */
  contractYears: number;
  /** Number of renewal (option) years — appended after the contract years. */
  optionYears: number;
  /** First-year monthly rent. */
  baseRent: number;
  escalationMode: RentEscalationMode;
  /** Percent (for "percent") or ₪ amount (for "fixed") added each year. */
  escalationValue: number;
}

function toCount(n: number): number {
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** Rent for lease-year `index` (0-based) under the given escalation rule. */
export function rentForYear(
  baseRent: number,
  index: number,
  escalationMode: RentEscalationMode,
  escalationValue: number,
): number {
  const base = Number.isFinite(baseRent) && baseRent > 0 ? baseRent : 0;
  const step = Number.isFinite(escalationValue) ? escalationValue : 0;
  if (index <= 0) return base;
  switch (escalationMode) {
    case "percent":
      return Math.round(base * Math.pow(1 + step / 100, index));
    case "fixed":
      return Math.round(base + step * index);
    case "none":
    case "custom":
    default:
      return base;
  }
}

/**
 * Builds the materialized lease-year schedule from term intent. In "custom" mode
 * amounts are not formula-driven — pass `existingRows` to preserve the user's
 * per-year amount *and* type, falling back to `baseRent` and the positional type
 * (contract years first, then option years) for newly added years.
 */
export function buildLeaseYears(
  input: LeaseScheduleInput,
  existingRows?: LeaseYear[],
): LeaseYear[] {
  const contract = toCount(input.contractYears);
  const option = toCount(input.optionYears);
  const total = contract + option;
  if (total === 0) return [];

  const base = Number.isFinite(input.baseRent) && input.baseRent > 0 ? input.baseRent : 0;
  const result: LeaseYear[] = [];
  for (let i = 0; i < total; i += 1) {
    const positionalType: LeaseYearType = i < contract ? "contract" : "option";
    if (input.escalationMode === "custom") {
      const prev = existingRows?.[i];
      result.push({ amount: prev?.amount ?? base, type: prev?.type ?? positionalType });
    } else {
      result.push({
        amount: rentForYear(base, i, input.escalationMode, input.escalationValue),
        type: positionalType,
      });
    }
  }
  return result;
}

export interface ReconstructedIntent {
  contractTermYears: number;
  optionYears: number;
  baseRent: number;
  escalationMode: RentEscalationMode;
}

/**
 * Recovers term intent from an existing `lease_years` array — used on edit when
 * the backend has not (yet) persisted the structured fields. Detects a uniform
 * schedule as "none"; anything else is treated as "custom" so the exact saved
 * amounts are preserved rather than re-derived.
 */
export function reconstructIntentFromLeaseYears(
  leaseYears: LeaseYear[] | undefined,
): ReconstructedIntent {
  const years = leaseYears ?? [];
  const contractTermYears = years.filter((y) => y.type === "contract").length;
  const optionYears = years.filter((y) => y.type === "option").length;
  const baseRent = years[0]?.amount ?? 0;
  const allEqual = years.length > 0 && years.every((y) => y.amount === baseRent);
  const escalationMode: RentEscalationMode =
    years.length === 0 || allEqual ? "none" : "custom";
  return { contractTermYears, optionYears, baseRent, escalationMode };
}
