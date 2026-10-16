/**
 * Display helpers for `Property.returns`. The figures themselves are computed by the backend
 * and never here: one calculation, so this screen and the assistant cannot disagree.
 */

import { formatMoney } from '@/src/shared/utils/money';

/**
 * "4.2%", or "+4.2%" with `signed`. Wrapped in directional isolates so a Hebrew line does not
 * move the sign or the percent to the other end of the number.
 */
export function formatPercent(ratio: number, signed = false): string {
  const pct = (ratio * 100).toFixed(1);
  const text = signed && ratio > 0 ? `+${pct}%` : `${pct}%`;
  return `\u2066${text}\u2069`;
}

/** Rent / mortgage as a whole percentage, "131%", isolated like `formatPercent`. */
export function formatCoverage(ratio: number): string {
  return `\u2066${Math.round(ratio * 100)}%\u2069`;
}

/**
 * A whole amount that may be negative, embedded left-to-right with a true minus, the way the
 * transaction rows write one. Plain `formatMoney` in a Hebrew row lets the bidi algorithm move
 * the "-" to the far end and drop the symbol out of place.
 */
export function formatWholeMoney(amount: number): string {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '\u2212' : '';
  return `\u202A${sign}${formatMoney(Math.abs(rounded))}\u202C`;
}
