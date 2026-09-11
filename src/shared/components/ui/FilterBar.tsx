import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { spacing } from '@/src/core/theme';
import { FilterChipsBar, type FilterChip } from './FilterChipsBar';

interface FilterBarProps {
  chips: FilterChip[];
  /**
   * A segmented control rendered under the chips - for the one filter on a screen that is a
   * short, fixed, mutually exclusive set. Kept out of the chip row on purpose: a choice with
   * three options should show all three rather than hide them behind a sheet.
   */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The filter controls on a list screen, grouped onto one raised surface.
 *
 * Shared by all four list screens so a filter row means the same thing everywhere. The card
 * is what separates the controls from the rows they act on - loose chips floating over the
 * page background read as part of the list.
 */
export function FilterBar({ chips, children, style }: FilterBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }, style]}>
      <FilterChipsBar chips={chips} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: spacing.sm,
    gap: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
