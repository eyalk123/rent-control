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
 *
 * Scrolling. An anchor also records the scroller it was registered inside, so a step whose
 * element is below the fold can be brought into view before it is measured — web gets this
 * free from `Element.scrollIntoView`, and without it a step simply opened against whatever
 * the user happened to be scrolled to, drawing the spotlight against a rect that was off
 * screen. The scroller arrives through context rather than a prop so that a nested stack
 * cannot pair an anchor with somebody else's ScrollView: whichever `TourScrollView` is
 * nearest in the tree is the one that owns it.
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

/**
 * A scroll container an anchor lives inside. Deliberately one method: the registry works
 * in window coordinates and only ever needs "move the content by this many points", which
 * both a plain ScrollView and a KeyboardAwareScrollView can honour.
 */
export interface TourScroller {
  /** Positive `dy` scrolls down — the content moves up, revealing what was below. */
  scrollBy: (dy: number) => void;
}

const TourScrollerContext = createContext<TourScroller | null>(null);

/** Wraps the children of a scroll container so the anchors inside it find it. */
export const TourScrollerProvider = TourScrollerContext.Provider;

export function useTourScroller(): TourScroller | null {
  return useContext(TourScrollerContext);
}

/** Result of asking for an anchor to be revealed. */
export interface ScrollIntoViewResult {
  /** True when a scroll was actually started — the caller must wait before measuring. */
  scrolled: boolean;
  /** The rect as measured *before* any scroll. Null once a scroll has invalidated it. */
  rect: AnchorRect | null;
}

/**
 * Where a revealed anchor is aimed, as a fraction of the viewport height.
 *
 * `TOP`/`BOTTOM` are the band an anchor is left alone in — an element already comfortably
 * on screen must not jump, which is what web's `block: 'nearest'` buys. `TARGET` is where
 * the top of an off-screen anchor is put: high enough that the card has room underneath,
 * low enough that a card placed above it still fits.
 */
const VISIBLE_TOP = 0.12;
const VISIBLE_BOTTOM = 0.86;
const TARGET_TOP = 0.28;
/** Below this the scroll is not worth the animation. */
const MIN_SCROLL = 8;

interface AnchorEntry {
  node: Measurable;
  /** The nearest enclosing scroller, or null for an anchor on fixed chrome (a tab bar). */
  scroller: TourScroller | null;
}

interface AnchorRegistryValue {
  /** Returns an unregister function. Safe to call with null (unmount). */
  register: (key: string, node: Measurable | null, scroller?: TourScroller | null) => void;
  /** Measures a registered anchor, or resolves null if it is not mounted. */
  measure: (key: string) => Promise<AnchorRect | null>;
  /** Whether an anchor is currently mounted — used to gate a tour on its target existing. */
  has: (key: string) => boolean;
  /**
   * Brings an anchor into view if it is not already, and reports whether it moved.
   *
   * `viewportHeight` is the window height rather than the scroller's own bounds: the
   * scroller fills what is left of the screen on every one of these forms, and asking a
   * KeyboardAwareScrollView where it thinks it is costs a second async measure for a
   * correction of a few points. A scroll that overshoots the content end is clamped by
   * the ScrollView itself, and the caller re-measures afterwards regardless.
   */
  scrollIntoView: (key: string, viewportHeight: number) => Promise<ScrollIntoViewResult>;
}

const AnchorRegistryContext = createContext<AnchorRegistryValue | null>(null);

export function AnchorRegistryProvider({ children }: PropsWithChildren) {
  const nodes = useRef(new Map<string, AnchorEntry>());

  const register = useCallback(
    (key: string, node: Measurable | null, scroller: TourScroller | null = null) => {
      if (node) nodes.current.set(key, { node, scroller });
      else nodes.current.delete(key);
    },
    [],
  );

  const measure = useCallback((key: string): Promise<AnchorRect | null> => {
    const node = nodes.current.get(key)?.node;
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

  const scrollIntoView = useCallback(
    async (key: string, viewportHeight: number): Promise<ScrollIntoViewResult> => {
      const rect = await measure(key);
      const scroller = nodes.current.get(key)?.scroller;
      // Nothing to scroll (fixed chrome), or nothing measurable to scroll to.
      if (!scroller || !rect || viewportHeight <= 0) return { scrolled: false, rect };

      const top = rect.y;
      const bottom = rect.y + rect.height;
      const bandTop = viewportHeight * VISIBLE_TOP;
      const bandBottom = viewportHeight * VISIBLE_BOTTOM;
      // An anchor taller than the band can never sit inside it, so for those the question
      // is only whether the top is already where it should be. The top is the part the
      // spotlight and the copy are about; the tail is allowed to run off the screen.
      const tooTall = rect.height > bandBottom - bandTop;
      const settled = tooTall
        ? top >= 0 && top <= bandTop
        : top >= bandTop && bottom <= bandBottom;
      if (settled) return { scrolled: false, rect };

      const dy = top - viewportHeight * (tooTall ? VISIBLE_TOP : TARGET_TOP);
      if (Math.abs(dy) < MIN_SCROLL) return { scrolled: false, rect };

      scroller.scrollBy(dy);
      // The rect just measured describes where the anchor *was*; the caller must wait for
      // the scroll to settle and read it again rather than draw against a stale one.
      return { scrolled: true, rect: null };
    },
    [measure],
  );

  const value = useMemo(
    () => ({ register, measure, has, scrollIntoView }),
    [register, measure, has, scrollIntoView],
  );

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
  // Read at registration time rather than passed in: an anchor deep inside a form has no
  // idea which screen mounted it, and every caller would otherwise have to thread a prop
  // down to say so.
  const scroller = useTourScroller();
  return useCallback(
    (node: Measurable | null) => {
      // An undefined key is a deliberate opt-out — a repeated row where only the first
      // one carries the anchor still renders the same wrapper, it just doesn't register.
      if (!key) return;
      registry?.register(key, node, scroller);
    },
    [registry, key, scroller],
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
