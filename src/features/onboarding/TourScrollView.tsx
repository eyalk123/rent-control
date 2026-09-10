/**
 * Onboarding — scroll hosts (mobile).
 *
 * A tour step points at an element; nothing guarantees that element is on screen. Web gets
 * the answer free from `Element.scrollIntoView`, which walks up to whatever scroller the
 * anchor happens to live in. React Native has no equivalent, so a screen has to say which
 * container scrolls, and that is all this file is for.
 *
 * Two shapes, because the app has two kinds of scroller:
 *   - `useTourScrollHost` for a component that already renders its own ScrollView and only
 *     needs the wiring (FormScrollView, which renders a KeyboardAwareScrollView);
 *   - `TourScrollView` for a screen that renders a plain ScrollView and wants it handled.
 *
 * Both track the scroll offset themselves rather than asking the ScrollView for it. RN
 * exposes no synchronous "where am I" on a ScrollView ref, and the one place that keeps it
 * — KeyboardAwareScrollView's internal `position` — is not part of its public API. An
 * `onScroll` handler is; `Animated.forkEvent` inside that library means passing our own
 * does not displace its keyboard tracking.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import {
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';
import { TourScrollerProvider, type TourScroller } from './AnchorRegistry';

/** The two scroll APIs we have to satisfy: RN's ScrollView and the keyboard-aware HOC. */
interface ScrollLike {
  scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToPosition?: (x: number, y: number, animated?: boolean) => void;
}

/**
 * Wiring for a component that owns its own scroll view.
 *
 * Spread `scrollProps` onto it, and wrap its children in `<TourScrollerProvider>` with the
 * returned `scroller` so the anchors inside can find it.
 */
export function useTourScrollHost() {
  const ref = useRef<ScrollLike | null>(null);
  const offset = useRef(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  }, []);

  const scroller = useMemo<TourScroller>(
    () => ({
      scrollBy: (dy) => {
        const node = ref.current;
        if (!node) return;
        // Negative targets are clamped by the ScrollView anyway; clamping here as well
        // keeps a bounce-enabled list from rubber-banding past the top on the way.
        const y = Math.max(0, offset.current + dy);
        if (typeof node.scrollToPosition === 'function') node.scrollToPosition(0, y, true);
        else node.scrollTo?.({ x: 0, y, animated: true });
      },
    }),
    [],
  );

  return {
    scroller,
    scrollProps: {
      ref: ref as React.Ref<never>,
      onScroll,
      // 16ms rather than the default 0 (which fires once per drag on iOS): the offset has
      // to be current the moment a step opens, not a gesture later.
      scrollEventThrottle: 16,
    },
  };
}

/**
 * A plain ScrollView that tour anchors inside it can be scrolled to. A drop-in replacement
 * — every prop is forwarded — for a screen that scrolls its own content.
 */
export function TourScrollView({ children, ...props }: ScrollViewProps) {
  const { scroller, scrollProps } = useTourScrollHost();
  return (
    <ScrollView {...props} {...scrollProps}>
      <TourScrollerProvider value={scroller}>{children}</TourScrollerProvider>
    </ScrollView>
  );
}
