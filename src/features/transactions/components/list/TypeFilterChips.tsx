/**
 * Three pill chips: All / Revenue / Expense.
 * Active chip is filled navy; inactive chips have a hairline outline.
 */
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { darkColors, lightColors, spacing } from '@/src/core/theme';

export type TransactionTypeFilter = 'all' | 'revenue' | 'expense';

interface TypeFilterChipsProps {
  value: TransactionTypeFilter;
  onChange: (value: TransactionTypeFilter) => void;
}

export function TypeFilterChips({ value, onChange }: TypeFilterChipsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const options: { value: TransactionTypeFilter; label: string }[] = [
    {
      value: 'all',
      label: t('transactions.filterAll', { defaultValue: 'All' }),
    },
    {
      value: 'revenue',
      label: t('transactions.filterRevenue', { defaultValue: 'Revenue' }),
    },
    {
      value: 'expense',
      label: t('transactions.filterExpense', { defaultValue: 'Expense' }),
    },
  ];

  const handlePress = (next: TransactionTypeFilter) => {
    if (next === value) return;
    Haptics.selectionAsync();
    onChange(next);
  };

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => handlePress(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? colors.primary : 'transparent',
                borderColor: active ? colors.primary : colors.outline,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.onPrimary : colors.textPrimary },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
