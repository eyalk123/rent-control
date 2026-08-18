import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState, LoadingOverlay, SegmentedControl } from '@/src/shared/components/ui';
import { useTransactionsList } from '@/src/features/transactions/hooks/useTransactions';
import { RevenuePaymentPanel } from '@/src/features/transactions/components/detail/RevenuePaymentPanel';
import { ExpensePanel } from '@/src/features/transactions/components/detail/ExpensePanel';
import type { TransactionsTabState } from '@/src/features/transactions/components/detail/tabState';
import { spacing } from '@/src/core/theme';
import type { Renter } from '@/src/shared/types';

interface RenterTransactionsTabProps {
  renter: Renter;
  /** Held by the screen, which outlives this tab — see `detail/tabState.ts`. */
  state: TransactionsTabState;
  onStateChange: (state: TransactionsTabState) => void;
}

/**
 * Revenue and expenses answer different questions and deserve different shapes, so they
 * get separate sections rather than one mixed ledger: revenue as a month-by-month payment
 * grid, expenses as a category breakdown over time.
 */
export function RenterTransactionsTab({ renter, state, onStateChange }: RenterTransactionsTabProps) {
  const { t } = useTranslation();
  const patch = (next: Partial<TransactionsTabState>) => onStateChange({ ...state, ...next });

  const { transactions, loading, error, refreshTransactions, retryLoad } = useTransactionsList({
    renterId: renter.id,
  });

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
        // The lease is the story here, so every year it covers is on screen at once.
        <RevenuePaymentPanel
          renters={[renter]}
          transactions={transactions}
          propertyId={renter.property_id}
          onRecorded={refreshTransactions}
          layout="stacked"
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
