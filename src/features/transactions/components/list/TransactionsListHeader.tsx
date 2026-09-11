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

/**
 * First-frame fallback for the title row height, in dp. The real value is measured and
 * reported through `onTitleRowLayout` - this is only what `SuppliersHeaderButton` uses for
 * the frame before layout lands, and on the empty/error states, which render no title row.
 */
export const TITLE_ROW_HEIGHT_FALLBACK = 56;

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
  /** Reports the measured title row height so the floating Suppliers button can clear it. */
  onTitleRowLayout?: (height: number) => void;
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
  onTitleRowLayout,
}: TransactionsListHeaderProps) {
  const { t } = useTranslation();
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <View>
      <View
        style={styles.titleRow}
        onLayout={(e) => onTitleRowLayout?.(e.nativeEvent.layout.height)}
      >
        <Text
          variant="headlineLarge"
          maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
          numberOfLines={2}
          style={[styles.screenTitle, rtlLabelStyle]}
        >
          {t('screens.transactions')}
        </Text>
        <SettingsGearButton />
      </View>
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
