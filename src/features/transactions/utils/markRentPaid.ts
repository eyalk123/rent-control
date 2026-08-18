import { createRevenueTransaction } from '@/src/features/transactions/api/transactions';
import { normalizePaymentType } from '@/src/shared/constants/paymentMethods';

export interface MarkRentPaidInput {
  property_id: number;
  renter_id: number | null;
  amount: number;
  /** "YYYY-MM" — the month the rent is *for*, which is rarely the month it arrives in. */
  monthFor: string;
  /** The renter's stored payment_type; normalized to a PaymentMethod here. */
  paymentType?: string | null;
}

/**
 * Records a rent payment in one shot — the affordance behind "Mark paid" on an overdue
 * alert and behind an unpaid box on the payment grid.
 *
 * There is no mark-as-paid endpoint: paid *is* the existence of a revenue row for that
 * month, so this simply creates one. Callers pass the month the rent is for, because the
 * grid records against any month while the alerts only ever mean the current one.
 *
 * Mirrors `useMarkRentPaid` in the web app's transactions `queries.ts`.
 */
export function markRentPaid(input: MarkRentPaidInput) {
  return createRevenueTransaction({
    property_id: input.property_id,
    renter_id: input.renter_id,
    amount: input.amount,
    date_of_payment: new Date().toISOString().slice(0, 10),
    month_for: `${input.monthFor}-01`,
    payment_method: normalizePaymentType(input.paymentType),
  });
}

/** "YYYY-MM" for today — what the overdue alerts always mean. */
export function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}
