import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { darkColors, lightColors } from '@/src/core/theme';

export type TransactionTypeFilter = 'all' | 'revenue' | 'expense';

interface TypeFilterChipsProps {
  value: TransactionTypeFilter;
  onChange: (value: TransactionTypeFilter) => void;
}

export function TypeFilterChips({ value, onChange }: TypeFilterChipsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const options: { value: TransactionTypeFilter; label: string; activeColor: string; activeBg: string }[] = [
    {
      value: 'all',
      label: t('transactions.filterAll', { defaultValue: 'All' }),
      activeColor: colors.onPrimary,
      activeBg: colors.primary,
    },
    {
      value: 'revenue',
      label: t('transactions.filterRevenue', { defaultValue: 'Revenue' }),
      activeColor: colors.revFg,
      activeBg: colors.revBg,
    },
    {
      value: 'expense',
      label: t('transactions.filterExpense', { defaultValue: 'Expense' }),
      activeColor: colors.expFg,
      activeBg: colors.expBg,
    },
  ];

  const handlePress = (next: TransactionTypeFilter) => {
    if (next === value) return;
    Haptics.selectionAsync();
    onChange(next);
  };

  const trackColor = theme.dark ? 'rgba(241,236,223,0.08)' : 'rgba(26,45,74,0.07)';

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => handlePress(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.segment,
              active && { backgroundColor: opt.activeBg },
              pressed && !active && { opacity: 0.6 },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? opt.activeColor : colors.textSecondary },
                active && styles.labelActive,
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
  track: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '700',
  },
});
