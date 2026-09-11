import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState, LoadingOverlay, SegmentedControl } from '@/src/shared/components/ui';
import { RevenuePaymentPanel } from '@/src/features/transactions/components/detail/RevenuePaymentPanel';
import { ExpensePanel } from '@/src/features/transactions/components/detail/ExpensePanel';
import type { TransactionsTabState } from '@/src/features/transactions/components/detail/tabState';
import { spacing } from '@/src/core/theme';
import type { Property, Transaction } from '@/src/shared/types';

interface PropertyTransactionsTabProps {
  property: Property;
  /** Held by the screen, which outlives this tab — see `detail/tabState.ts`. */
  state: TransactionsTabState;
  onStateChange: (state: TransactionsTabState) => void;
  /** Fetched once by the screen and shared with the Info tab's KPI tiles. */
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  retryLoad: () => void;
  /** Re-fetches the shared list, so recording a payment also updates the Info tab's tiles. */
  refreshTransactions: () => void;
}

/**
 * Revenue renders as a renter × month matrix here rather than a single strip, because a
 * property's payment history is several leases laid end to end. The property payload nests
 * every renter with their lease intact — active and past alike — so a renter who moved out
 * still gets a row in the years they lived there.
 *
 * That matrix keeps its year selector: unlike the renter screen, stacking every year would
 * multiply by the number of renters.
 */
export function PropertyTransactionsTab({
  property,
  state,
  onStateChange,
  transactions,
  loading,
  error,
  retryLoad,
  refreshTransactions,
}: PropertyTransactionsTabProps) {
  const { t } = useTranslation();
  const patch = (next: Partial<TransactionsTabState>) => onStateChange({ ...state, ...next });

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.centered}>
        <LoadingOverlay visible />
      </View>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          message={error}
          icon="alert-circle"
          actionLabel={t('common.tryAgain')}
          onAction={retryLoad}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <SegmentedControl
          value={state.section}
          onChange={(section) => patch({ section })}
          segments={[
            { value: 'revenue', label: t('transactions.revenue', { defaultValue: 'Revenue' }) },
            { value: 'expenses', label: t('transactions.expenses', { defaultValue: 'Expenses' }) },
          ]}
        />
      </View>

      {state.section === 'revenue' ? (
        <RevenuePaymentPanel
          renters={property.renters ?? []}
          transactions={transactions}
          propertyId={property.id}
          onRecorded={refreshTransactions}
          layout="single-year"
          year={state.revYear}
          onYearChange={(revYear) => patch({ revYear })}
        />
      ) : (
        <ExpensePanel
          transactions={transactions}
          year={state.expYear}
          onYearChange={(expYear) => patch({ expYear })}
          month={state.expMonth}
          onMonthChange={(expMonth) => patch({ expMonth })}
          category={state.expCategory}
          onCategoryChange={(expCategory) => patch({ expCategory })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
