import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, ICON_LG, lightColors, spacing, MAX_TIGHT_FONT_SCALE } from '@/src/core/theme';
import { TITLE_ROW_HEIGHT_FALLBACK } from './TransactionsListHeader';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';

interface SuppliersHeaderButtonProps {
  colors: typeof lightColors | typeof darkColors;
  onPress: () => void;
  label: string;
  /** Measured height of the title row this button floats beside. */
  titleRowHeight?: number;
}

export function SuppliersHeaderButton({
  colors,
  onPress,
  label,
  titleRowHeight = TITLE_ROW_HEIGHT_FALLBACK,
}: SuppliersHeaderButtonProps) {
  // Two things move this button, and both used to be guessed at.
  //
  // The inset: the title row starts at the safe-area inset, so clearing the row means
  // clearing the inset too. The old fixed `top: 72` was in raw screen coordinates, so on a
  // 44dp inset the row ran 44-100dp and the button landed 28dp inside it, over the gear.
  //
  // The row height: measured, not assumed. A constant survived a 1.3x font scale only
  // because the row happens to be pinned by a 40dp icon that does not scale - luck, not
  // design. A larger title, a bigger gear or a taller line box would have broken it again.
  const insets = useSafeAreaInsets();
  // The seed on the Transactions tour points here — this button is the one thing a new
  // user cannot identify without pressing it.
  const anchorRef = useTourAnchor(ANCHORS.transactionsSuppliersButton);
  const shadow = Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 8 },
    default: {},
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { top: insets.top + titleRowHeight + spacing.sm }]}
    >
      <View
        ref={anchorRef}
        collapsable={false}
        style={[styles.btn, shadow, { backgroundColor: colors.primary }]}
        renderToHardwareTextureAndroid
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Icon name="store" size={ICON_LG} color={colors.accent} />
          <Text
            maxFontSizeMultiplier={MAX_TIGHT_FONT_SCALE}
            style={[styles.label, { color: colors.accent }]}
          >
            {label}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // `top` is set inline from the safe-area inset; see the component.
    position: 'absolute',
    right: spacing.lg,
  },
  btn: {
    width: 62,
    minHeight: 68,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
