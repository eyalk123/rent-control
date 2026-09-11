import { getLeaseEndDate, type Renter } from '@/src/shared/types';

/**
 * Where a renter sits in the lease lifecycle — is this tenancy running at all.
 *
 * Distinct from the attention-level status the cards show (overdue / expiring): this is
 * the prior question, and it wins. A lease that has ended is neither overdue nor
 * expiring, whatever the home lists still hold.
 */
export type RenterLifecycle = 'upcoming' | 'active' | 'ended';

/** Start-of-day, so a lease ending today still counts as active for its whole last day. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** The earlier of an early termination and `scheduled`. Shared by the two end dates below. */
function withTermination(renter: Renter, scheduled: Date | null): Date | null {
  if (!renter.terminated_on) return scheduled;
  const terminated = new Date(renter.terminated_on);
  if (isNaN(terminated.getTime())) return scheduled;
  if (!scheduled) return terminated;
  return terminated < scheduled ? terminated : scheduled;
}

/**
 * The end date to show, *and* the date that decides whether the lease is still running:
 * the binding term (`getLeaseEndDate`), pulled in by an early termination.
 *
 * The binding term is the contract block — option years are excluded, because an option
 * is a right the tenant holds, not a commitment either side has made. An option that was
 * actually taken up is recorded by flipping that year's `type` from `option` to
 * `contract` (what the Extend-lease screen's per-year toggle does), so an exercised
 * option lands inside the contract block and counts here. An unexercised one does not,
 * and the tenancy reads as ended once the contract block runs out.
 *
 * This deliberately no longer matches the backend, whose `effective_lease_end()` coalesces
 * `terminated_on` with a stored `lease_end` that is `schedule_end` — options included, as
 * though every option were always exercised. That treats a tenant who never renewed as
 * still in place for the length of options they never took. The backend's own
 * `contract_end()` docstring already states the rule this follows: "An option year is not
 * yet exercised."
 */
export function getEffectiveLeaseEnd(renter: Renter): Date | null {
  return withTermination(renter, getLeaseEndDate(renter));
}

export function isTerminated(renter: Renter): boolean {
  return Boolean(renter.terminated_on);
}

export function getRenterLifecycle(renter: Renter, today: Date = startOfToday()): RenterLifecycle {
  // An explicit termination ends the lease the moment it is recorded, even when the last
  // day is today. The owner has declared the tenancy over, so the app must stop offering
  // to extend it. (The server's active window is deliberately *not* the same: it keeps
  // the renter chaseable through that final day, because this month's rent may still be
  // owed.)
  if (isTerminated(renter)) return 'ended';

  const end = getEffectiveLeaseEnd(renter);
  if (end && end < today) return 'ended';

  if (renter.lease_start) {
    const start = new Date(renter.lease_start);
    if (!isNaN(start.getTime()) && start > today) return 'upcoming';
  }

  // No dates at all reads as active rather than ended — a half-entered renter is
  // something the owner is still working on, not an archived one.
  return 'active';
}

/**
 * The renters a property's "current" figures are about — everyone whose lease has not
 * ended. Same split the property renters tab shows as current vs. previous tenants.
 *
 * Upcoming leases stay in: one signed to start next month still holds the property. An
 * ended one is gone, but it stays attached to the property as the record of who was here,
 * so any "who is renting this" read has to filter rather than take the list as it comes.
 */
export function getCurrentRenters(renters: Renter[] | null | undefined): Renter[] {
  if (!renters?.length) return [];
  return renters.filter((r) => getRenterLifecycle(r) !== 'ended');
}
