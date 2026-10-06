import { Pressable, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors, radii, MAX_CHROME_FONT_SCALE } from '@/src/core/theme';

interface PropertyOwnersHeaderButtonProps {
  onPress: () => void;
  label: string;
}

/** The way into Property owners from the Properties tab: a pill beside the gear, the same
 *  one the Transactions tab uses for Suppliers. */
export function PropertyOwnersHeaderButton({ onPress, label }: PropertyOwnersHeaderButtonProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
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
      <Icon name="users" size={16} color={colors.primary} />
      <Text
        maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
        numberOfLines={1}
        style={[styles.label, { color: colors.textPrimary }]}
      >
        {label}
      </Text>
    </Pressable>
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
