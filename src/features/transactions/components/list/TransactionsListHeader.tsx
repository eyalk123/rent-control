import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { spacing } from '@/src/core/theme';
import { useRtlLabelStyle } from '@/src/context';
import type { MonthBucket } from '@/src/features/transactions/utils/aggregate';
import { TransactionsHero } from './TransactionsHero';
import { MonthsBarChart } from './MonthsBarChart';
import { FilterChipsBar, type FilterChip, type FilterChipsBarHandle } from './FilterChipsBar';
import { TypeFilterChips, type TransactionTypeFilter } from './TypeFilterChips';
import { ActiveFilterPills } from '@/src/shared/components/ui/ActiveFilterPills';

interface TransactionsListHeaderProps {
  filterChipsRef: RefObject<FilterChipsBarHandle | null>;
  filterChips: FilterChip[];
  typeFilter: TransactionTypeFilter;
  onTypeFilterChange: (value: TransactionTypeFilter) => void;
  heroBucket: MonthBucket;
  sixMonthBuckets: MonthBucket[];
  selectedKey: string;
  onSelectMonth: (key: string) => void;
  summaryLoading: boolean;
}

export function TransactionsListHeader({
  filterChipsRef,
  filterChips,
  typeFilter,
  onTypeFilterChange,
  heroBucket,
  sixMonthBuckets,
  selectedKey,
  onSelectMonth,
  summaryLoading,
}: TransactionsListHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <View>
      <Text variant="headlineLarge" style={[styles.screenTitle, rtlLabelStyle]}>
        {t('screens.transactions')}
      </Text>
      <DevProfiler id="TransactionsHero">
        <TransactionsHero bucket={heroBucket} loading={summaryLoading} />
      </DevProfiler>
      <DevProfiler id="MonthsBarChart">
        <MonthsBarChart buckets={sixMonthBuckets} selectedKey={selectedKey} onSelectMonth={onSelectMonth} loading={summaryLoading} />
      </DevProfiler>
      <View style={[styles.filterCard, { backgroundColor: theme.colors.surface }]}>
        <DevProfiler id="FilterChipsBar">
          <FilterChipsBar ref={filterChipsRef} chips={filterChips} />
        </DevProfiler>
        <ActiveFilterPills chips={filterChips} />
        <DevProfiler id="TypeFilterChips">
          <TypeFilterChips value={typeFilter} onChange={onTypeFilterChange} />
        </DevProfiler>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontWeight: '700',
    fontSize: 28,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  filterCard: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: 16,
    padding: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
