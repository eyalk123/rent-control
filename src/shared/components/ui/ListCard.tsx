import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { cardShadow, darkColors, lightColors, radii, spacing } from '@/src/core/theme';

interface ListCardProps {
  onPress: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
}

/**
 * The row surface on the list screens.
 *
 * Borderless on purpose. The outlined Paper card put a line around every row, on top of the
 * filter card's shadow and the chips' own outlines, and the screen read as a stack of boxes.
 * A soft navy-cast shadow separates the rows from the cream without drawing an edge.
 */
export function ListCard({ onPress, onLongPress, children }: ListCardProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>{children}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: 5,
    marginHorizontal: spacing.lg,
    padding: 14,
    borderRadius: radii.lg,
    ...cardShadow,
  },
});
