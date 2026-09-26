import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { spacing, MAX_CHROME_FONT_SCALE } from '@/src/core/theme';
import { useRtlLabelStyle } from '@/src/context';
import type { MonthBucket } from '@/src/features/transactions/utils/aggregate';
import { TransactionsHero } from './TransactionsHero';
import { MonthsBarChart } from './MonthsBarChart';
import { type FilterChip } from './FilterChipsBar';
import { TypeFilterChips, type TransactionTypeFilter } from './TypeFilterChips';
import { FilterBar } from '@/src/shared/components/ui/FilterBar';
import { SettingsGearButton } from '@/src/shared/components/ui/SettingsGearButton';
import { SuppliersHeaderButton } from './SuppliersHeaderButton';

interface TransactionsTitleRowProps {
  onSuppliersPress: () => void;
  /** Hidden in select mode, where the row's controls would act on the wrong thing. */
  showSuppliers?: boolean;
}

/**
 * Title, Suppliers and the gear. Exported so the empty and error states carry the same row:
 * Suppliers has to stay reachable before the first transaction exists.
 */
export function TransactionsTitleRow({ onSuppliersPress, showSuppliers = true }: TransactionsTitleRowProps) {
  const { t } = useTranslation();
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <View style={styles.titleRow}>
      <Text
        variant="headlineLarge"
        maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
        numberOfLines={2}
        style={[styles.screenTitle, rtlLabelStyle]}
      >
        {t('screens.transactions')}
      </Text>
      <View style={styles.titleActions}>
        {showSuppliers ? (
          <SuppliersHeaderButton onPress={onSuppliersPress} label={t('suppliers.title')} />
        ) : null}
        <SettingsGearButton />
      </View>
    </View>
  );
}

interface TransactionsListHeaderProps {
  filterChips: FilterChip[];
  typeFilter: TransactionTypeFilter;
  onTypeFilterChange: (value: TransactionTypeFilter) => void;
  heroBucket: MonthBucket;
  sixMonthBuckets: MonthBucket[];
  selectedKey: string;
  onSelectMonth: (key: string) => void;
  summaryLoading: boolean;
  summaryError: string | null;
  onRetrySummary: () => void;
  onSuppliersPress: () => void;
  showSuppliers?: boolean;
}

export function TransactionsListHeader({
  filterChips,
  typeFilter,
  onTypeFilterChange,
  heroBucket,
  sixMonthBuckets,
  selectedKey,
  onSelectMonth,
  summaryLoading,
  summaryError,
  onRetrySummary,
  onSuppliersPress,
  showSuppliers,
}: TransactionsListHeaderProps) {
  return (
    <View>
      <TransactionsTitleRow onSuppliersPress={onSuppliersPress} showSuppliers={showSuppliers} />
      <DevProfiler id="TransactionsHero">
        <TransactionsHero bucket={heroBucket} loading={summaryLoading} />
      </DevProfiler>
      <DevProfiler id="MonthsBarChart">
        <MonthsBarChart
          buckets={sixMonthBuckets}
          selectedKey={selectedKey}
          onSelectMonth={onSelectMonth}
          loading={summaryLoading}
          error={summaryError}
          onRetry={onRetrySummary}
        />
      </DevProfiler>
      <FilterBar chips={filterChips} style={styles.filterCard}>
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
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  screenTitle: {
    flexShrink: 1,
    fontWeight: '700',
    fontSize: 28,
    marginBottom: spacing.sm,
    // No horizontal padding: the list's content container already insets by spacing.lg, and
    // padding here as well put the title 16dp further in than on every other tab.
    paddingTop: spacing.sm,
  },
  filterCard: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
});
