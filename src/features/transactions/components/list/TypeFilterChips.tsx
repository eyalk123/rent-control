import React from 'react';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { darkColors, lightColors } from '@/src/core/theme';
import { FilterSegmentedControl, type FilterSegment } from '@/src/shared/components/ui';

export type TransactionTypeFilter = 'all' | 'revenue' | 'expense';

interface TypeFilterChipsProps {
  value: TransactionTypeFilter;
  onChange: (value: TransactionTypeFilter) => void;
}

/**
 * Revenue / expense is the one filter in the app whose options already own a colour, so this
 * hands those colours to the shared control rather than taking its navy default. Everything
 * else about it - track, sizing, haptics - is the shared component.
 */
export const TypeFilterChips = React.memo(function TypeFilterChips({ value, onChange }: TypeFilterChipsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const segments = React.useMemo<FilterSegment<TransactionTypeFilter>[]>(() => [
    {
      value: 'all',
      label: t('transactions.filterAll', { defaultValue: 'All' }),
    },
    {
      value: 'revenue',
      label: t('transactions.filterRevenue', { defaultValue: 'Revenue' }),
      activeBg: colors.revBg,
      activeFg: colors.revFg,
    },
    {
      value: 'expense',
      label: t('transactions.filterExpense', { defaultValue: 'Expense' }),
      activeBg: colors.expBg,
      activeFg: colors.expFg,
    },
  ], [t, colors]);

  return (
    <FilterSegmentedControl
      segments={segments}
      value={value}
      onChange={onChange}
      accessibilityLabel={t('filters.type', { defaultValue: 'Type' })}
    />
  );
});
