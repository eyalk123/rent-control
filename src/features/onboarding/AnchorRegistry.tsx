/**
 * Onboarding — anchor registry (mobile).
 *
 * Phase 1 infrastructure. This file is deliberately inert: it renders nothing, draws
 * nothing, and reads no tour state. Its only job is to let a component say "I am the
 * element known as `transactions.suppliersButton`" so that a later overlay can measure
 * where that element ended up on screen.
 *
 * Registration is by key from `anchors.ts`. Nothing else should invent a key.
 *
 * Android note: `measureInWindow` returns zeroes for views that React Native has
 * flattened away, so every anchor host sets `collapsable={false}`.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type PropsWithChildren,
} from 'react';
import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The subset of a native view handle we need. */
interface Measurable {
  measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void;
}

interface AnchorRegistryValue {
  /** Returns an unregister function. Safe to call with null (unmount). */
  register: (key: string, node: Measurable | null) => void;
  /** Measures a registered anchor, or resolves null if it is not mounted. */
  measure: (key: string) => Promise<AnchorRect | null>;
  /** Whether an anchor is currently mounted — used to gate a tour on its target existing. */
  has: (key: string) => boolean;
}

const AnchorRegistryContext = createContext<AnchorRegistryValue | null>(null);

export function AnchorRegistryProvider({ children }: PropsWithChildren) {
  const nodes = useRef(new Map<string, Measurable>());

  const register = useCallback((key: string, node: Measurable | null) => {
    if (node) nodes.current.set(key, node);
    else nodes.current.delete(key);
  }, []);

  const measure = useCallback((key: string): Promise<AnchorRect | null> => {
    const node = nodes.current.get(key);
    if (!node?.measureInWindow) return Promise.resolve(null);
    return new Promise((resolve) => {
      // measureInWindow never calls back if the view has been detached, so don't
      // leave a tour hanging on it.
      const timer = setTimeout(() => resolve(null), 250);
      node.measureInWindow!((x, y, width, height) => {
        clearTimeout(timer);
        resolve(width === 0 && height === 0 ? null : { x, y, width, height });
      });
    });
  }, []);

  const has = useCallback((key: string) => nodes.current.has(key), []);

  const value = useMemo(() => ({ register, measure, has }), [register, measure, has]);

  return (
    <AnchorRegistryContext.Provider value={value}>{children}</AnchorRegistryContext.Provider>
  );
}

/**
 * Returns the registry. Null outside the provider rather than throwing — an anchor on a
 * screen rendered in isolation (a test, a storybook) must not crash the screen.
 */
export function useAnchorRegistry(): AnchorRegistryValue | null {
  return useContext(AnchorRegistryContext);
}

/**
 * Ref callback for a component that already renders a measurable host view.
 *
 *   const ref = useTourAnchor(ANCHORS.transactionsList);
 *   <View ref={ref} collapsable={false} />
 */
export function useTourAnchor(key: string | undefined) {
  const registry = useAnchorRegistry();
  return useCallback(
    (node: Measurable | null) => {
      // An undefined key is a deliberate opt-out — a repeated row where only the first
      // one carries the anchor still renders the same wrapper, it just doesn't register.
      if (!key) return;
      registry?.register(key, node);
    },
    [registry, key],
  );
}

/**
 * Wrapper for anything that does not forward a ref to a host view — a Pressable, an
 * icon, a third-party component. Adds one View to the tree and nothing else.
 *
 *   <TourAnchor id={ANCHORS.tabHome}>{icon}</TourAnchor>
 */
export function TourAnchor({
  id,
  style,
  pointerEvents,
  children,
}: PropsWithChildren<{
  /** Undefined renders the wrapper without registering — see useTourAnchor. */
  id?: string;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: ViewProps['pointerEvents'];
}>) {
  const ref = useTourAnchor(id);
  return (
    <View ref={ref} collapsable={false} style={style} pointerEvents={pointerEvents}>
      {children}
    </View>
  );
}
