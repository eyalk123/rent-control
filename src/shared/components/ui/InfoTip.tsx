import React from 'react';
import {
  I18nManager,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { darkColors, lightColors, spacing, ICON_XS } from '@/src/core/theme';
import { Icon } from './Icon';

interface InfoTipProps {
  /** Accessible name for the icon, e.g. "About Gross yield". */
  label: string;
  /** The explanation. A string is set as body text; pass nodes for more than one paragraph. */
  children: React.ReactNode;
}

const BUBBLE_MAX_WIDTH = 288;
const GAP = 6;

/**
 * A small (i) beside a label that explains it — the mobile twin of the web app's InfoTip.
 *
 * Phones have no hover, so it opens on tap and closes on any tap outside it or on Back. The
 * bubble is anchored to the icon (below it, or above when there is no room) rather than being
 * a dialog: it is a footnote to read and dismiss, not a decision to make.
 */
export function InfoTip({ label, children }: InfoTipProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const anchorRef = React.useRef<View>(null);
  const [anchor, setAnchor] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // The bubble's own height, measured once it lays out: placing it above the icon needs it.
  const [bubbleH, setBubbleH] = React.useState<number | null>(null);

  const open = () => {
    // Page coordinates, which match the full-screen Modal's. Not measureInWindow: on Android
    // edge-to-edge it came back ~45dp short and put the bubble over the row above.
    anchorRef.current?.measure((_x, _y, w, h, x, y) => setAnchor({ x, y, w, h }));
  };
  const close = () => {
    setAnchor(null);
    setBubbleH(null);
  };

  const width = Math.min(BUBBLE_MAX_WIDTH, screenW - spacing.lg * 2);
  let position: object = {};
  let measuring = false;
  if (anchor) {
    // Centred on the icon, kept inside the screen's side gutters. Physical coordinates
    // throughout: measure reports them, and in RTL React Native swaps left and right,
    // so the physical left edge is set through `right` there.
    const centre = anchor.x + anchor.w / 2;
    const physicalLeft = Math.max(spacing.lg, Math.min(centre - width / 2, screenW - spacing.lg - width));
    const horizontal = I18nManager.isRTL ? { right: physicalLeft } : { left: physicalLeft };
    // Below the icon in the top half of the screen, above it in the bottom half. Always set
    // through `top`: on Android the window height excludes the system bars that a translucent
    // Modal covers, so anything measured from the bottom lands short by their height.
    const below = anchor.y + anchor.h / 2 < (screenH - insets.bottom) / 2;
    if (below) {
      position = { ...horizontal, top: anchor.y + anchor.h + GAP };
    } else {
      measuring = bubbleH == null;
      position = { ...horizontal, top: Math.max(insets.top, anchor.y - (bubbleH ?? 0) - GAP) };
    }
  }

  return (
    <>
      <Pressable
        ref={anchorRef}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
        // A 20dp box, one line of label text, so it never makes a row taller; 12dp of slop on
        // every side brings the target to 44dp, the touch-target floor.
        hitSlop={12}
        style={({ pressed }) => [styles.trigger, { opacity: pressed ? 0.5 : 0.75 }]}
      >
        <Icon name="info" size={ICON_XS} color={colors.textSecondary} />
      </Pressable>
      <Modal
        visible={anchor != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={close}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel={label} />
        <View
          accessibilityViewIsModal
          onLayout={(e) => setBubbleH(e.nativeEvent.layout.height)}
          style={[
            styles.bubble,
            position,
            { width, backgroundColor: colors.surface, borderColor: colors.outline },
            // Laid out once unseen to learn its height, then placed.
            measuring && { opacity: 0 },
          ]}
        >
          {typeof children === 'string' ? <InfoTipText>{children}</InfoTipText> : children}
        </View>
      </Modal>
    </>
  );
}

/** A paragraph inside an InfoTip. `secondary` for an example or an aside under the main text. */
export function InfoTipText({ children, secondary }: { children: React.ReactNode; secondary?: boolean }) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  return (
    <Text
      variant="bodySmall"
      style={[styles.text, { color: secondary ? colors.textSecondary : colors.textPrimary }]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    position: 'absolute',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    // Elevation level 3 (dialog), navy dialect — MOBILE-DESIGN.md §6.
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  text: {
    lineHeight: 19,
  },
});
