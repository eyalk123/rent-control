import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import type { useTranslation } from 'react-i18next';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

type MonthGridPickerProps = {
  gridYear: number;
  onYearChange: (year: number) => void;
  selectedMonths: Set<string>;
  onToggle: (monthStr: string) => void;
  locale: string;
  colors: typeof lightColors | typeof darkColors;
  totalSelected: number;
  t: ReturnType<typeof useTranslation>['t'];
};

export function MonthGridPicker({
  gridYear,
  onYearChange,
  selectedMonths,
  onToggle,
  locale,
  colors,
  totalSelected,
  t,
}: MonthGridPickerProps) {
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(locale, { month: 'short' }),
  );

  return (
    <View style={styles.container}>
      <View style={styles.yearRow}>
        <TouchableOpacity
          onPress={() => onYearChange(gridYear - 1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="titleSmall" style={{ color: colors.textPrimary }}>
          {gridYear}
        </Text>
        <TouchableOpacity
          onPress={() => onYearChange(gridYear + 1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-right" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {monthNames.map((name, i) => {
          const monthStr = `${gridYear}-${String(i + 1).padStart(2, '0')}-01`;
          const selected = selectedMonths.has(monthStr);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onToggle(monthStr)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.inputFilledBackground,
                  borderColor: selected ? colors.primary : colors.outline,
                },
              ]}
            >
              <Text
                variant="bodySmall"
                style={{
                  color: selected ? colors.onPrimary : colors.textPrimary,
                  fontWeight: selected ? '700' : '400',
                }}
              >
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {totalSelected > 0 && (
        <Text
          variant="bodySmall"
          style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }}
        >
          {t('transactions.bulkRevenue.monthsSelected', {
            count: totalSelected,
            defaultValue: '{{count}} months selected',
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    width: '23%',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
