/**
 * Device connectivity, and the app-wide "we are offline" decision.
 *
 * The app is a thin client over the API with no local store, so with no connection there is
 * nothing to show. Rather than let nine screens fail in nine different ways, this provider
 * owns one boolean and `OfflineGate` blocks the app on it.
 *
 * Three deliberate choices, each of which was a bug the obvious version would have had:
 *
 * 1. The signal is `isConnected`, NOT `isInternetReachable`. The latter runs a reachability
 *    probe that reports false on captive portals, on some VPNs, and on networks that block
 *    the probe endpoint. A banner that is wrong is noise; a full-screen gate that is wrong
 *    locks the user out of an app that works. We take the conservative signal and accept
 *    that "connected to wifi with no route out" falls through to a per-request error.
 *
 * 2. Offline is debounced, online is immediate. Lifts, tunnels and cell handoffs drop the
 *    connection for a second or two constantly; a gate that slams up every time is worse
 *    than the problem it solves. Coming back is never delayed — that direction is always
 *    good news.
 *
 * 3. Nothing is reported until NetInfo has given a definitive first answer. Its initial
 *    `isConnected` is `null`, and treating that as offline flashes the gate on every cold
 *    start.
 *
 * The client (src/core/api/client.ts) is not a component and cannot read this context, so
 * the provider pushes the current value down to it through `setOfflineChecker`, the same
 * shape as the existing `setAuthTokenGetter`.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { setOfflineChecker } from '@/src/core/api/client';
import { USE_MOCK_API } from '@/src/core/api/mock';

/** How long the connection must stay down before we believe it. See note 2 above. */
const OFFLINE_DEBOUNCE_MS = 3000;

export interface NetworkContextType {
  /** True only once the device has reported no connection for OFFLINE_DEBOUNCE_MS. */
  isOffline: boolean;
  /**
   * Re-query NetInfo now and apply the answer immediately, skipping the debounce.
   * This is the gate's "Try Again": if NetInfo ever misreads a working network, the user
   * always has a way out that does not involve restarting the app.
   */
  recheck: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * The undebounced truth, for the API client only.
   *
   * The debounce above exists to stop the *gate* flapping; it is not a reason to make a
   * request wait. A call fired while the device genuinely has no connection should fail at
   * once, otherwise the ~9 requests this app makes on launch each burn the full 10s axios
   * timeout during the debounce window and land their errors long after the gate is up.
   */
  const rawConnectedRef = useRef<boolean | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** `immediate` is the Try Again path — apply what NetInfo just said without waiting. */
  const apply = useCallback(
    (connected: boolean | null, immediate = false) => {
      clearTimer();
      // `null` means NetInfo has not decided yet — say nothing rather than guess offline.
      if (connected === null) return;
      rawConnectedRef.current = connected;
      if (connected) {
        setIsOffline(false);
        return;
      }
      if (immediate) {
        setIsOffline(true);
        return;
      }
      timerRef.current = setTimeout(() => setIsOffline(true), OFFLINE_DEBOUNCE_MS);
    },
    [clearTimer],
  );

  useEffect(() => {
    // Preview/mock mode has no backend to reach, so connectivity is irrelevant there and
    // gating it would just block the emulator UI work the flag exists for.
    if (USE_MOCK_API) return;
    const unsubscribe = NetInfo.addEventListener((state) => apply(state.isConnected));
    return () => {
      unsubscribe();
      clearTimer();
    };
  }, [apply, clearTimer]);

  const recheck = useCallback(async () => {
    if (USE_MOCK_API) return;
    const state = await NetInfo.refresh();
    apply(state.isConnected, true);
  }, [apply]);

  // Hand the client a reader for the undebounced value, once. It reads through the ref on
  // every request, so there is nothing to re-register when connectivity changes.
  useEffect(() => {
    setOfflineChecker(() => rawConnectedRef.current === false);
  }, []);

  const value = useMemo(() => ({ isOffline, recheck }), [isOffline, recheck]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextType {
  const ctx = useContext(NetworkContext);
  if (ctx === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return ctx;
}
