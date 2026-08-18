import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { darkColors, lightColors, spacing } from '@/src/core/theme';

/**
 * Key to the payment grid.
 *
 * The two amber corner markers are the reason this exists: on the web they explain
 * themselves on hover, which is nothing on a touch screen, so without a legend they were a
 * pair of unexplained dots. The four box colours are listed alongside them for the same
 * reason.
 */
export function RentGridLegend() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const swatches = [
    { key: 'paid', backgroundColor: colors.revBg, borderColor: colors.revFg, opacity: 1 },
    { key: 'overdue', backgroundColor: colors.expBg, borderColor: colors.expFg, opacity: 1 },
    { key: 'due', backgroundColor: colors.subtleOutline, borderColor: colors.outline, opacity: 1 },
    { key: 'future', backgroundColor: colors.subtleOutline, borderColor: colors.subtleOutline, opacity: 0.65 },
  ];

  return (
    <View style={styles.row}>
      {swatches.map((s) => (
        <View key={s.key} style={styles.item}>
          <View
            style={[
              styles.swatch,
              { backgroundColor: s.backgroundColor, borderColor: s.borderColor, opacity: s.opacity },
            ]}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t(`transactions.rentStatus.${s.key}`)}
          </Text>
        </View>
      ))}

      <View style={styles.item}>
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t('transactions.rentGrid.legendMismatch', { defaultValue: 'Amount differs from the lease' })}
        </Text>
      </View>

      <View style={styles.item}>
        <View style={[styles.tick, { backgroundColor: colors.warning }]} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t('transactions.rentGrid.legendLate', { defaultValue: 'Paid after the due day' })}
        </Text>
      </View>
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tick: {
    width: 10,
    height: 5,
    borderRadius: 1,
  },
  label: {
    fontSize: 11,
  },
});
