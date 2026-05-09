import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { spacing } from '@/src/core/theme';
import type { MonthBucket } from '@/src/features/transactions/utils/aggregate';
import { TransactionsHero } from './TransactionsHero';
import { MonthsBarChart } from './MonthsBarChart';
import { FilterChipsBar, type FilterChip, type FilterChipsBarHandle } from './FilterChipsBar';
import { TypeFilterChips, type TransactionTypeFilter } from './TypeFilterChips';

interface TransactionsListHeaderProps {
  filterChipsRef: RefObject<FilterChipsBarHandle>;
  filterChips: FilterChip[];
  typeFilter: TransactionTypeFilter;
  onTypeFilterChange: (value: TransactionTypeFilter) => void;
  heroBucket: MonthBucket;
  sixMonthBuckets: MonthBucket[];
  currentKey: string;
  summaryLoading: boolean;
}

export function TransactionsListHeader({
  filterChipsRef,
  filterChips,
  typeFilter,
  onTypeFilterChange,
  heroBucket,
  sixMonthBuckets,
  currentKey,
  summaryLoading,
}: TransactionsListHeaderProps) {
  const theme = useTheme();

  return (
    <View>
      <DevProfiler id="TransactionsHero">
        <TransactionsHero bucket={heroBucket} loading={summaryLoading} />
      </DevProfiler>
      <DevProfiler id="MonthsBarChart">
        <MonthsBarChart buckets={sixMonthBuckets} currentKey={currentKey} loading={summaryLoading} />
      </DevProfiler>
      <View style={[styles.filterCard, { backgroundColor: theme.colors.surface }]}>
        <DevProfiler id="FilterChipsBar">
          <FilterChipsBar ref={filterChipsRef} chips={filterChips} />
        </DevProfiler>
        <DevProfiler id="TypeFilterChips">
          <TypeFilterChips value={typeFilter} onChange={onTypeFilterChange} />
        </DevProfiler>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
