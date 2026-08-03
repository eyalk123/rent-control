/**
 * The day of the month rent is assumed due when a renter has no `payment_day_of_month`.
 *
 * This mirrors the backend: the overdue engine treats a missing payment day as the 1st when
 * deciding whether rent is late. That fallback is deliberate — an owner who never set a day
 * should still be chased — but it used to be invisible, because the form left the field empty
 * and the lease card hid the row entirely. So rent was chased on a date the owner had never
 * been shown.
 *
 * Keep this in step with the backend fallback, and with the web app's copy of the same
 * constant (`rent-control-web/src/shared/constants/paymentDay.ts`).
 */
export const DEFAULT_PAYMENT_DAY_NUM = 1;

/**
 * The form models the payment day as a full date and keeps only the day part
 * (`parsePaymentDay`), so the default has to be expressed in that same shape.
 */
export const DEFAULT_PAYMENT_DATE = `2000-01-${String(DEFAULT_PAYMENT_DAY_NUM).padStart(2, "0")}`;
