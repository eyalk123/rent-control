import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { darkColors, lightColors, useEntityColor } from '@/src/core/theme';
import { ColorDot } from './ColorDot';
import { InitialsTile } from './InitialsTile';

/** Side of every mark, so rows of different kinds line up in one sheet. */
const MARK = 36;

/**
 * Initials in the item's color - a renter, or a supplier in its first category's color.
 * `neutral` draws the navy tint property owners use instead.
 */
export function InitialsMark({
  name,
  color,
  neutral = false,
}: {
  name: string;
  color?: string | null;
  neutral?: boolean;
}) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const tint = useEntityColor(color);
  return (
    <InitialsTile
      name={name}
      size={MARK}
      radius={11}
      backgroundColor={neutral ? colors.primaryBg : tint.bg}
      textColor={neutral ? colors.primary : tint.fg}
    />
  );
}

/** A category: its color as a dot on its own tint. */
export function DotMark({ color }: { color: string | null | undefined }) {
  const tint = useEntityColor(color);
  return (
    <View style={[styles.tile, { backgroundColor: tint.bg }]}>
      <ColorDot color={color} size={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: MARK,
    height: MARK,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
