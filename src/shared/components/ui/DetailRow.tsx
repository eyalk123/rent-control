import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing, ICON_SM } from '@/src/core/theme';
import { Icon, type IconName } from './Icon';

interface DetailRowProps {
  label: string;
  /** Right-hand value. Omit when passing `children` instead. */
  value?: string;
  /**
   * Leading icon. Off by default and deliberately so: a pin beside "Zip Code" or a
   * briefcase beside "Property owner" repeats what the label already says, and the old
   * rows tinted it per section so the same glyph changed colour between cards. Pass one
   * only where it carries status the label does not (an insurance shield, a document).
   */
  icon?: IconName;
  iconColor?: string;
  /** Override the value colour, e.g. for a revenue or expense amount. */
  valueColor?: string;
  /** Custom right-hand content. Takes precedence over `value`. */
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

/**
 * One label/value line inside a `DetailSection`. Separators are drawn by the section,
 * never here.
 */
export function DetailRow({
  label,
  value,
  icon,
  iconColor,
  valueColor,
  children,
  onPress,
  style,
  accessibilityLabel,
}: DetailRowProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const body = (
    <>
      <View style={styles.left}>
        {icon != null && (
          <Icon name={icon} size={ICON_SM} color={iconColor ?? colors.textSecondary} />
        )}
        <Text
          variant="bodyMedium"
          style={[styles.label, { color: colors.textSecondary }]}
        >
          {label}
        </Text>
      </View>

      {children ?? (
        <Text
          variant="bodyMedium"
          style={[styles.value, { color: valueColor ?? colors.textPrimary }]}
        >
          {value}
        </Text>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        android_ripple={{ color: colors.outline }}
        style={({ pressed }) => [
          styles.row,
          pressed && { opacity: 0.6 },
          style,
        ]}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={[styles.row, style]}>{body}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    // Hard floor from MOBILE-DESIGN.md §5: density buys tighter text, not smaller targets.
    minHeight: 48,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  label: {
    flexShrink: 1,
  },
  value: {
    fontWeight: '600',
    // No explicit textAlign: 'auto' follows the value's own direction, which is what mixed
    // Hebrew/Latin content needs. A hardcoded 'right' does not flip under I18nManager.
    flexShrink: 1,
  },
});
