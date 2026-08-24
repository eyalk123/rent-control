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
 * lays out right-to-left in Hebrew. Nothing here reverses anything manually — doing so
 * double-flips it, which is the bug the LeaseTermBuilder comment warns about.
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
  Dimensions,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useAnchorRegistry, type AnchorRect } from './AnchorRegistry';
import { useTourController } from './TourController';
import { callbackKey, seedKey, tourStepKey } from './types';

/** Breathing room around the highlighted element. */
const SPOTLIGHT_PAD = 8;
const SPOTLIGHT_RADIUS = 14;
const CARD_GAP = 14;
const CARD_MAX_WIDTH = 360;

export function TourOverlay() {
  const controller = useTourController();
  const registry = useAnchorRegistry();
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [rect, setRect] = useState<AnchorRect | null>(null);
  // Where this overlay sits in window coordinates — the origin every measured anchor is
  // translated against. See the note at the top of the file.
  const hostRef = useRef<View | null>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const handleHostLayout = useCallback(() => {
    hostRef.current?.measureInWindow?.((x, y) => setOrigin({ x, y }));
  }, []);

  const active = controller?.active ?? null;
  const step = controller?.step ?? null;
  const anchorKey = step?.anchor ?? null;

  // Re-measure whenever the step changes. The rect is read once per step rather than
  // tracked continuously: these anchors are chrome (tab bars, headers, form rows) that do
  // not move while a modal card is covering the screen.
  useEffect(() => {
    let cancelled = false;
    if (!anchorKey || !registry) {
      setRect(null);
      return;
    }
    registry.measure(anchorKey).then((r) => {
      if (!cancelled) setRect(r);
    });
    return () => {
      cancelled = true;
    };
  }, [anchorKey, registry, active?.tour.id, active?.stepIndex]);

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

  // Place the card on whichever side of the anchor has more room, ignoring the step's
  // stated preference when that side cannot actually fit it.
  const spaceAbove = box ? box.y : 0;
  const spaceBelow = box ? screenH - (box.y + box.height) : 0;
  const preferTop = step.placement === 'top';
  const placeAbove = box ? (preferTop ? spaceAbove > 180 : spaceBelow < 200 && spaceAbove > spaceBelow) : false;

  const cardPosition = box
    ? placeAbove
      ? { bottom: screenH - box.y + CARD_GAP }
      : { top: box.y + box.height + CARD_GAP }
    : { top: screenH / 2 - 120 };

  return (
    <View
      ref={hostRef}
      onLayout={handleHostLayout}
      collapsable={false}
      style={styles.host}
      pointerEvents="box-none"
    >
      {/* Backdrop. Tapping outside advances rather than dismisses — a stray tap should
          not silently end a tour the user has not read. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleNext} accessible={false}>
        {box ? (
          <>
            <View style={[styles.scrim, { top: 0, left: 0, right: 0, height: box.y }]} />
            <View
              style={[
                styles.scrim,
                { top: box.y + box.height, left: 0, right: 0, bottom: 0 },
              ]}
            />
            <View
              style={[styles.scrim, { top: box.y, left: 0, width: box.x, height: box.height }]}
            />
            <View
              style={[
                styles.scrim,
                { top: box.y, left: box.x + box.width, right: 0, height: box.height },
              ]}
            />
            {/* Ring around the cutout so the target reads as chosen, not merely unshaded. */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: box.y,
                left: box.x,
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
          style={[
            styles.card,
            cardPosition,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outline,
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

          <View style={styles.footer}>
            <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
              {t('onboarding.ui.stepOf', { current, total })}
            </Text>
            <View style={styles.actions}>
              {!controller?.isFirst ? (
                <Pressable onPress={handleBack} hitSlop={8} style={styles.textBtn}>
                  <Text variant="labelLarge" style={{ color: colors.textSecondary }}>
                    {t('onboarding.ui.back')}
                  </Text>
                </Pressable>
              ) : (
                <Pressable onPress={handleSkip} hitSlop={8} style={styles.textBtn}>
                  <Text variant="labelLarge" style={{ color: colors.textSecondary }}>
                    {t('onboarding.ui.skip')}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={handleNext}
                hitSlop={8}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              >
                <Text variant="labelLarge" style={{ color: colors.accentFg, fontWeight: '700' }}>
                  {controller?.isLast ? t('onboarding.ui.done') : t('onboarding.ui.next')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
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
    width: Dimensions.get('window').width - spacing.lg * 2,
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
