import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { spacing } from '@/src/core/theme';
import { useRtlLabelStyle } from '@/src/context';
import type { MonthBucket } from '@/src/features/transactions/utils/aggregate';
import { TransactionsHero } from './TransactionsHero';
import { MonthsBarChart } from './MonthsBarChart';
import { type FilterChip, type FilterChipsBarHandle } from './FilterChipsBar';
import { TypeFilterChips, type TransactionTypeFilter } from './TypeFilterChips';
import { FilterBar } from '@/src/shared/components/ui/FilterBar';
import { SettingsGearButton } from '@/src/shared/components/ui/SettingsGearButton';

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
  const { t } = useTranslation();
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <View>
      <View style={styles.titleRow}>
        <Text variant="headlineLarge" style={[styles.screenTitle, rtlLabelStyle]}>
          {t('screens.transactions')}
        </Text>
        <SettingsGearButton />
      </View>
      <DevProfiler id="TransactionsHero">
        <TransactionsHero bucket={heroBucket} loading={summaryLoading} />
      </DevProfiler>
      <DevProfiler id="MonthsBarChart">
        <MonthsBarChart buckets={sixMonthBuckets} selectedKey={selectedKey} onSelectMonth={onSelectMonth} loading={summaryLoading} />
      </DevProfiler>
      <FilterBar chips={filterChips} chipsRef={filterChipsRef} style={styles.filterCard}>
        <DevProfiler id="TypeFilterChips">
          <TypeFilterChips value={typeFilter} onChange={onTypeFilterChange} />
        </DevProfiler>
      </FilterBar>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  },
});
