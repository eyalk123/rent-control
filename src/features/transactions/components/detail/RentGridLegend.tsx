import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { darkColors, lightColors, spacing } from '@/src/core/theme';

/**
 * Key to the payment grid's box colours.
 *
 * Only statuses: the grid no longer draws per-month markers for late or mismatched
 * payments. Those are counted in the year summary, which highlights the months on tap, and
 * explained in words in the month sheet, so nothing here needs a key.
 */
export function RentGridLegend() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const swatches: {
    key: string;
    backgroundColor: string;
    borderColor: string;
    opacity: number;
    borderStyle?: 'solid' | 'dashed';
  }[] = [
    { key: 'paid', backgroundColor: colors.revBg, borderColor: colors.revFg, opacity: 1 },
    { key: 'overdue', backgroundColor: colors.expBg, borderColor: colors.expFg, opacity: 1 },
    { key: 'due', backgroundColor: colors.subtleOutline, borderColor: colors.outline, opacity: 1 },
    { key: 'future', backgroundColor: colors.subtleOutline, borderColor: colors.subtleOutline, opacity: 0.65 },
    // The off-months of a quarterly or yearly lease. Unfilled and dashed, so it reads as a
    // slot the schedule deliberately leaves empty rather than as a month still pending.
    // Full opacity here, unlike the 0.55 the grid cell itself carries: the cell is ~60px and
    // reads fine when faint, but a 14px swatch at the same opacity disappeared entirely and
    // the legend entry looked like a missing icon. The dashes alone carry "not filled".
    {
      key: 'notDue',
      backgroundColor: 'transparent',
      borderColor: colors.textSecondary,
      opacity: 1,
      borderStyle: 'dashed',
    },
  ];

  return (
    <View style={styles.row}>
      {swatches.map((s) => (
        <View key={s.key} style={styles.item}>
          <View
            style={[
              styles.swatch,
              {
                backgroundColor: s.backgroundColor,
                borderColor: s.borderColor,
                opacity: s.opacity,
                borderStyle: s.borderStyle ?? 'solid',
              },
            ]}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t(`transactions.rentStatus.${s.key}`)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.md,
    rowGap: spacing.xs,
    marginTop: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
  },
});
