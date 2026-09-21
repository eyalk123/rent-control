import { mockPropertyIds } from '@/src/core/api/mock';
import type { Subscription } from '../types';

/**
 * Subscription state for the dev web preview and the emulator, with no backend.
 *
 * Deliberately a *restricted* account — free plan, more properties than it covers, two of
 * three scans spent, assistant excluded. The unrestricted case is what every other fixture
 * already shows; the states worth being able to look at without a backend are the awkward
 * ones, because they are the ones nobody reaches by accident.
 *
 * `__setMockPlan('tier_9_15')` from a dev screen or a debugger switches plan for a session.
 */
const LIMITS: Record<Subscription['plan'], { limit: number | null; scans: number | null; agent: boolean }> = {
  free: { limit: 2, scans: 3, agent: false },
  tier_3_8: { limit: 8, scans: null, agent: true },
  tier_9_15: { limit: 15, scans: null, agent: true },
  tier_16_plus: { limit: null, scans: null, agent: true },
};

let plan: Subscription['plan'] = 'free';
let scansUsed = 2;
let lockNoticeSeen = false;

export function __setMockPlan(next: Subscription['plan'], used?: number) {
  plan = next;
  if (used !== undefined) scansUsed = used;
  lockNoticeSeen = false;
}

export async function getSubscriptionMock(): Promise<Subscription> {
  const limits = LIMITS[plan];
  // `mockPropertyIds`, not `getProperties`: the latter now asks *this* function which
  // properties are locked, and calling it here would recurse forever.
  const ids = mockPropertyIds();
  const locked = limits.limit === null ? [] : ids.slice(limits.limit);

  return {
    plan,
    limit: limits.limit,
    property_count: ids.length,
    locked_property_ids: locked,
    show_lock_notice: locked.length > 0 && !lockNoticeSeen,
    enforced: true,
    source: plan === 'free' ? null : 'paddle',
    status: plan === 'free' ? null : 'active',
    period: plan === 'free' ? null : 'monthly',
    current_period_end: plan === 'free' ? null : '2026-10-21T00:00:00',
    price_amount: plan === 'free' ? null : 20,
    price_currency: plan === 'free' ? null : 'USD',
    monthly_lease_scans: limits.scans,
    lease_scans_used: scansUsed,
    agent: limits.agent,
  };
}

export async function acknowledgeLockNoticeMock(): Promise<void> {
  lockNoticeSeen = true;
}
