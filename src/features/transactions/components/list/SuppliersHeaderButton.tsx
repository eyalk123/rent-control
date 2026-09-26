import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors, radii, MAX_CHROME_FONT_SCALE } from '@/src/core/theme';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';

interface SuppliersHeaderButtonProps {
  onPress: () => void;
  label: string;
}

/**
 * The way into Suppliers from the Transactions tab: a pill in the title row, beside the gear.
 *
 * It used to float as a navy tile pinned under the title row, which meant measuring that row
 * to know where to sit - and once the list scrolled it sat on top of the first transaction and
 * hid its amount. In the row it scrolls away with the title, so it can never cover content,
 * and it needs no position of its own.
 */
export function SuppliersHeaderButton({ onPress, label }: SuppliersHeaderButtonProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  // The seed on the Transactions tour points here — this button is the one thing a new
  // user cannot identify without pressing it.
  const anchorRef = useTourAnchor(ANCHORS.transactionsSuppliersButton);

  return (
    <View ref={anchorRef} collapsable={false}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        hitSlop={6}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor: colors.primaryBg, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Icon name="store" size={16} color={colors.primary} />
        <Text
          maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
          numberOfLines={1}
          style={[styles.label, { color: colors.textPrimary }]}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
