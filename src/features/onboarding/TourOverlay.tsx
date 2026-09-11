/**
 * Onboarding — the overlay (mobile).
 *
 * Draws whatever TourController says is active: a dimmed backdrop with a cutout around
 * the anchored element, and a card explaining it.
 *
 * The spotlight is four rects rather than an SVG mask. A mask would need react-native-svg
 * in the render path of every tour step for a shape that is always a rounded rectangle;
 * four plain Views composite on the UI thread and cost nothing.
 *
 * Direction: the app forces native RTL via I18nManager (see core/i18n), so `row` already
 * lays out right-to-left in Hebrew, and `borderStart*` puts the seed's accent bar on the
 * leading edge. Nothing in the *card* reverses anything manually — doing so double-flips
 * it, which is the bug the LeaseTermBuilder comment warns about.
 *
 * The *spotlight* is the exception, and it is not a contradiction. `measureInWindow`
 * reports unmirrored physical coordinates, but RN swaps the `left` and `right` style
 * props under RTL (I18nManager.doLeftAndRightSwapInRTL, on by default). Feeding a
 * physical x into `left` therefore mirrored the cutout — in Hebrew the first step
 * highlighted the Chat tab instead of Home. `physicalLeft` pre-compensates so the hole
 * lands on the element that was actually measured.
 *
 * Deliberately NOT a Modal. A Modal is its own Android window with its own origin, which
 * does not line up with what `measureInWindow` reports for views in the app window — on
 * this emulator the spotlight landed ~50dp high, and the exact offset depends on the
 * status bar, the display cutout and whether the app is edge-to-edge. Rather than chase a
 * correction factor, the overlay renders as an absolutely-positioned sibling of the app
 * content, so measured coordinates and drawn coordinates are the same space by
 * construction. It is mounted inside DirectionalContent for that reason.
 *
 * Even so, the host View is not guaranteed to sit at the window origin — measured on the
 * emulator, `measureInWindow` reported the Home tab at y=794.67dp while the host started
 * ~50dp lower down the window, so the spotlight drew that far above its target. Instead of
 * hard-coding a status-bar correction (which varies by device, cutout and edge-to-edge
 * mode), the host measures *itself* and every anchor rect is converted from window space
 * into host-local space. That is correct whatever the inset turns out to be.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  I18nManager,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  darkColors,
  lightColors,
  spacing,
  MAX_CHROME_FONT_SCALE,
  useIsLargeText,
} from '@/src/core/theme';
import { useAnchorRegistry, type AnchorRect } from './AnchorRegistry';
import { useTourController } from './TourController';
import { callbackKey, seedKey, tourStepKey } from './types';

/** Breathing room around the highlighted element. */
const SPOTLIGHT_PAD = 8;
const SPOTLIGHT_RADIUS = 14;
const CARD_GAP = 14;
const CARD_MAX_WIDTH = 360;
/** Minimum breathing room between the card and any screen edge. */
const EDGE_MARGIN = 16;
/**
 * How long to leave an animated scroll before reading where the anchor landed. RN's
 * smooth scroll has no completion callback, so this is a wait rather than a signal.
 */
const SCROLL_SETTLE_MS = 380;
/**
 * A second read, after everything has had a frame to settle.
 *
 * A rect is measured the moment a step opens, which on several screens is a moment too
 * early: the reports hub had only just laid out its second card, so the spotlight was
 * drawn short and clipped it, and the rule editor measured its offsets field before the
 * name field above had finished, so the hole sat high enough to include it. Both looked
 * like the wrong anchor and were the right anchor read too soon. Cheap enough to always
 * do — a measure is one native call and the second one usually agrees with the first.
 */
const REMEASURE_MS = 300;

export function TourOverlay() {
  const controller = useTourController();
  const registry = useAnchorRegistry();
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isLargeText = useIsLargeText();
  const [rect, setRect] = useState<AnchorRect | null>(null);
  // Where this overlay sits in window coordinates — the origin every measured anchor is
  // translated against. See the note at the top of the file.
  const hostRef = useRef<View | null>(null);
  // Height as well as position: the card is clamped against the *host's* bottom, and on a
  // device with gesture navigation that is not the bottom of the window.
  const [origin, setOrigin] = useState({ x: 0, y: 0, height: 0 });
  const insets = useSafeAreaInsets();

  const handleHostLayout = useCallback(() => {
    hostRef.current?.measureInWindow?.((x, y, _w, height) => setOrigin({ x, y, height }));
  }, []);

  // The card's own height, so it can be kept inside the viewport. A large anchor (a list
  // filling the screen) otherwise pushes it off the top, which clipped the title and the
  // seed callback entirely.
  const [cardHeight, setCardHeight] = useState(0);
  const handleCardLayout = useCallback(
    (e: LayoutChangeEvent) => setCardHeight(e.nativeEvent.layout.height),
    [],
  );

  const active = controller?.active ?? null;
  const step = controller?.step ?? null;
  const anchorKey = step?.anchor ?? null;

  // Re-measure whenever the step changes. The rect is not tracked continuously: these
  // anchors are chrome (tab bars, headers, form rows) that do not move while a modal card
  // is covering the screen — but it is read twice, and after a scroll, because *when* it
  // is read turns out to matter a great deal. See REMEASURE_MS.
  useEffect(() => {
    let cancelled = false;
    if (!anchorKey || !registry) {
      setRect(null);
      return;
    }
    let settle: ReturnType<typeof setTimeout> | undefined;

    const read = async () => {
      const r = await registry.measure(anchorKey);
      if (!cancelled) setRect(r);
    };

    void (async () => {
      // Bring the anchor on screen first. A step pointing at a field below the fold used
      // to open against whatever the user was scrolled to: the spotlight clamped itself to
      // the screen edge and the card was placed against a rect nobody could see. Web has
      // had this from the start via Element.scrollIntoView.
      const { scrolled, rect: measured } = await registry.scrollIntoView(anchorKey, screenH);
      if (cancelled) return;
      if (!scrolled) {
        // Already where it should be — draw immediately rather than blanking the spotlight
        // for a settle we are not waiting on.
        setRect(measured);
      } else {
        // Mid-scroll the old rect describes nothing. A brief full scrim is honest; holding
        // the previous step's cutout while the screen moves under it is not.
        setRect(null);
        await new Promise<void>((resolve) => {
          settle = setTimeout(() => resolve(), SCROLL_SETTLE_MS);
        });
        if (cancelled) return;
        await read();
      }
      if (cancelled) return;
      settle = setTimeout(() => void read(), REMEASURE_MS);
    })();

    return () => {
      cancelled = true;
      if (settle) clearTimeout(settle);
    };
  }, [anchorKey, registry, screenH, active?.tour.id, active?.stepIndex]);

  const handleNext = useCallback(() => controller?.next(), [controller]);
  const handleBack = useCallback(() => controller?.back(), [controller]);
  const handleSkip = useCallback(() => controller?.skip(), [controller]);

  // Without a Modal there is no automatic back-button handling, and Android's back must
  // dismiss the tour rather than navigate away underneath it.
  useEffect(() => {
    if (!controller?.active) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      controller.skip();
      return true;
    });
    return () => sub.remove();
  }, [controller]);

  if (!active || !step) return null;

  const tourId = active.tour.id;
  const title = t(tourStepKey(tourId, step.id, 'title'));
  const body = t(tourStepKey(tourId, step.id, 'body'));
  const seedText = step.seed ? t(seedKey(step.seed.id)) : null;
  // Only on the first step, and only when the user actually saw the seed that sent them.
  const callback =
    active.arrivedFrom && active.stepIndex === 0 ? t(callbackKey(active.arrivedFrom)) : null;

  const total = active.tour.steps.length;
  const current = active.stepIndex + 1;

  /**
   * Converts a physical x into the value `left` must carry for the box to land there.
   * Under RTL the style is swapped to `right`, so the distance is measured from the
   * opposite edge and has to be inverted here.
   */
  const physicalLeft = (x: number, w: number) => (I18nManager.isRTL ? screenW - x - w : x);

  // Spotlight geometry, clamped so a partially offscreen anchor cannot produce a
  // negative-size rect.
  const box = rect
    ? {
        x: Math.max(0, rect.x - origin.x - SPOTLIGHT_PAD),
        y: Math.max(0, rect.y - origin.y - SPOTLIGHT_PAD),
        width: Math.min(screenW, rect.width + SPOTLIGHT_PAD * 2),
        height: Math.min(screenH, rect.height + SPOTLIGHT_PAD * 2),
      }
    : null;

  /**
   * The band the card may occupy, in host-local coordinates.
   *
   * Both limits are expressed against the host rather than the window, and the safe-area
   * inset is only applied to the extent the host does not already clear it: on a screen
   * where the host starts below the status bar, `origin.y` has already paid that cost and
   * subtracting it again would push the card needlessly far down. Without this, a card sent
   * to the top edge for a full-screen anchor drew underneath the clock and the battery.
   */
  const minTop = Math.max(EDGE_MARGIN, insets.top + EDGE_MARGIN - origin.y);
  const hostBottom = origin.height || screenH;
  const maxBottom = Math.min(hostBottom, screenH - insets.bottom - origin.y) - EDGE_MARGIN;

  // Card placement is always expressed as a top offset so it can be clamped. The step's
  // preferred side is honoured only when the card actually fits there.
  const fits = (top: number) => top >= minTop && top + cardHeight <= maxBottom;

  let cardTop: number;
  if (!box) {
    cardTop = (minTop + maxBottom - cardHeight) / 2;
  } else {
    const below = box.y + box.height + CARD_GAP;
    const above = box.y - CARD_GAP - cardHeight;
    const preferred = step.placement === 'top' ? above : below;
    const fallback = step.placement === 'top' ? below : above;
    if (fits(preferred)) cardTop = preferred;
    else if (fits(fallback)) cardTop = fallback;
    else {
      // Neither side fits — a list anchor covering most of the screen. Centring on the
      // anchor was the old answer and it is the worst one available: it puts the card
      // squarely over the thing the card is describing. Go to whichever edge has more
      // room instead, so what is covered is the far end of the anchor rather than its
      // middle, and the spotlight still reads as a spotlight.
      const roomAbove = box.y - CARD_GAP;
      const roomBelow = screenH - (box.y + box.height) - CARD_GAP;
      cardTop = roomBelow >= roomAbove ? maxBottom - cardHeight : minTop;
    }
  }
  // Final guard: never let the card leave the band, whatever the anchor did.
  const cardPosition = { top: Math.max(minTop, Math.min(cardTop, maxBottom - cardHeight)) };

  return (
    <View
      ref={hostRef}
      onLayout={handleHostLayout}
      collapsable={false}
      style={styles.host}
      pointerEvents="box-none"
    >
      {/* Backdrop. Tapping outside does nothing at all — it neither advances nor
          dismisses. It used to advance, which made the tour far too easy to click
          through by accident: a tap anywhere, including on the highlighted control
          itself, skipped a step the user had not read. Moving on is the button's job.
          It still swallows the tap rather than passing it to the screen underneath, so
          nothing is triggered behind the card. Web follows the same rule. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="auto">
        {box ? (
          <>
            <View style={[styles.scrim, { top: 0, left: 0, width: screenW, height: box.y }]} />
            <View
              style={[
                styles.scrim,
                {
                  top: box.y + box.height,
                  left: 0,
                  width: screenW,
                  height: Math.max(0, screenH - (box.y + box.height)),
                },
              ]}
            />
            <View
              style={[
                styles.scrim,
                {
                  top: box.y,
                  left: physicalLeft(0, box.x),
                  width: box.x,
                  height: box.height,
                },
              ]}
            />
            <View
              style={[
                styles.scrim,
                {
                  top: box.y,
                  left: physicalLeft(box.x + box.width, Math.max(0, screenW - (box.x + box.width))),
                  width: Math.max(0, screenW - (box.x + box.width)),
                  height: box.height,
                },
              ]}
            />
            {/* Ring around the cutout so the target reads as chosen, not merely unshaded. */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: box.y,
                left: physicalLeft(box.x, box.width),
                width: box.width,
                height: box.height,
                borderRadius: SPOTLIGHT_RADIUS,
                borderWidth: 2,
                borderColor: colors.accent,
              }}
            />
          </>
        ) : (
          <View style={[styles.scrim, StyleSheet.absoluteFillObject]} />
        )}

        <View
          onLayout={handleCardLayout}
          style={[
            styles.card,
            cardPosition,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
              // Live width: a module-level Dimensions read is captured once and goes
              // stale on rotation.
              width: screenW - spacing.lg * 2,
              maxWidth: Math.min(CARD_MAX_WIDTH, screenW - spacing.lg * 2),
            },
          ]}
        >
          {callback ? (
            <Text variant="labelMedium" style={{ color: colors.accent, marginBottom: spacing.xs }}>
              {callback}
            </Text>
          ) : null}

          <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: '700' }}>
            {title}
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: colors.textSecondary, marginTop: spacing.xs }}
          >
            {body}
          </Text>

          {/* The seed. Visually a tier below the step's own copy: it is an invitation to
              something elsewhere, not an instruction about what is on screen. */}
          {seedText ? (
            <View
              style={[
                styles.seed,
                { backgroundColor: colors.background, borderStartColor: colors.accent },
              ]}
            >
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {seedText}
              </Text>
            </View>
          ) : null}

          <View style={[styles.footer, isLargeText && styles.footerStacked]}>
            <Text
              variant="labelSmall"
              maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
              style={{ color: colors.textSecondary }}
            >
              {t('onboarding.ui.stepOf', { current, total })}
            </Text>
            <View style={styles.actions}>
              {!controller?.isFirst ? (
                <Pressable onPress={handleBack} hitSlop={8} style={styles.textBtn}>
                  <Text
                    variant="labelLarge"
                    maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
                    style={{ color: colors.textSecondary }}
                  >
                    {t('onboarding.ui.back')}
                  </Text>
                </Pressable>
              ) : (
                <Pressable onPress={handleSkip} hitSlop={8} style={styles.textBtn}>
                  <Text
                    variant="labelLarge"
                    maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
                    style={{ color: colors.textSecondary }}
                  >
                    {t('onboarding.ui.skip')}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleNext}
                hitSlop={8}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              >
                <Text
                  variant="labelLarge"
                  maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
                  style={{ color: colors.accentFg, fontWeight: '700' }}
                >
                  {controller?.isLast ? t('onboarding.ui.done') : t('onboarding.ui.next')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    // Above the navigator's content, which sets no z-index of its own.
    zIndex: 1000,
    elevation: 24,
  },
  scrim: {
    position: 'absolute',
    backgroundColor: 'rgba(8,14,24,0.72)',
  },
  card: {
    position: 'absolute',
    alignSelf: 'center',
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    // Sits above the scrim in the same absolute layer.
    zIndex: 2,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  seed: {
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 10,
    borderStartWidth: 3,
  },
  footer: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  // Past the reflow threshold the counter and the actions stop fitting on one line, and the
  // row answers by truncating every child rather than giving anything up. Stack instead.
  footerStacked: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  textBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  primaryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
});
