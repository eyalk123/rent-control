import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing, useEntityColor } from '@/src/core/theme';
import { DetailBackButton } from './DetailBackButton';
import { Icon, type IconName } from './Icon';

const BUTTON = 44;

/**
 * A round action on a color band: the surface color under the glyph, so it reads on any of
 * the six tints and on a photo alike.
 */
export function BandButton({
  icon,
  onPress,
  accessibilityLabel,
  busy = false,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  busy?: boolean;
}) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.button, { backgroundColor: colors.surface }]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.textPrimary} />
      ) : (
        <Icon name={icon} size={20} color={colors.textPrimary} />
      )}
    </Pressable>
  );
}

/**
 * The top of the property and renter detail screens: a band in the item's color with its
 * picture, illustration or initials, the back button on the reading-start corner and the
 * screen's actions on the other.
 *
 * Both screens use it so they open the same way; only what sits on the band differs.
 */
export function ColorBand({
  color,
  fallbackHref,
  actions,
  height = 200,
  align = 'bottom',
  children,
}: {
  /** The item's stored color key. */
  color: string | null | undefined;
  /** Where back goes when the screen was opened cold. */
  fallbackHref: string;
  /** `BandButton`s, laid out on the reading-end corner. */
  actions?: React.ReactNode;
  height?: number;
  /** An illustration stands on the band's bottom edge; an avatar sits in the middle. */
  align?: 'bottom' | 'center';
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { bg } = useEntityColor(color);

  return (
    <View
      style={[
        styles.band,
        { height, backgroundColor: bg, justifyContent: align === 'bottom' ? 'flex-end' : 'center' },
      ]}
    >
      {children}
      <DetailBackButton
        fallbackHref={fallbackHref}
        top={spacing.md}
        color={colors.textPrimary}
        style={[styles.button, { backgroundColor: colors.surface }]}
      />
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    alignSelf: 'stretch',
    alignItems: 'center',
    overflow: 'hidden',
  },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    position: 'absolute',
    top: spacing.md,
    // Logical `end`: the corner opposite the back button, in either direction.
    end: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
