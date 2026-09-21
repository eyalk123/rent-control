/**
 * The account's plan (mobile).
 *
 * The web app holds this in React Query; mobile has no query layer, so it lives in a
 * context alongside the app's other providers — the same shape as `CountryContext`, for
 * the same reasons.
 *
 * **Not cached in AsyncStorage**, unlike the country. A stale plan read from disk would
 * either lock properties a landlord has just paid to unlock, or leave them writable after
 * a subscription lapsed. Both are worse than a brief `loading`, and the failure mode of a
 * missing answer is deliberately permissive: `locked` defaults to false, so a network
 * problem never turns into a landlord locked out of their own ledger.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { acknowledgeLockNotice, getSubscription } from './api/subscriptionApi';
import type { Subscription } from './types';

interface SubscriptionContextValue {
  subscription: Subscription | null;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Whether this property is above the plan's ceiling. False whenever unknown. */
  isLocked: (propertyId: number | null | undefined) => boolean;
  /** Whether the over-limit explanation is due. */
  showLockNotice: boolean;
  acknowledgeNotice: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn } = useAppAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    try {
      setSubscription(await getSubscription());
    } catch {
      // Swallowed on purpose. A plan we could not read must not block the app or strip
      // access — `isLocked` answers false without a subscription, so a failed fetch
      // degrades to "nothing is restricted" rather than to a lockout.
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!isLoaded) return;
    void refresh();
  }, [isLoaded, refresh]);

  const isLocked = useCallback(
    (propertyId: number | null | undefined) => {
      if (propertyId == null || !subscription?.enforced) return false;
      return subscription.locked_property_ids.includes(propertyId);
    },
    [subscription],
  );

  const acknowledgeNotice = useCallback(() => {
    // Optimistic: the flag is what stops the notice returning on the next launch, and a
    // failed POST is not worth showing anyone. It will be retried the next time the
    // notice is due.
    setSubscription((current) => (current ? { ...current, show_lock_notice: false } : current));
    void acknowledgeLockNotice().catch(() => {});
  }, []);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      subscription,
      loading,
      refresh,
      isLocked,
      showLockNotice: Boolean(subscription?.show_lock_notice && subscription.enforced),
      acknowledgeNotice,
    }),
    [subscription, loading, refresh, isLocked, acknowledgeNotice],
  );

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
