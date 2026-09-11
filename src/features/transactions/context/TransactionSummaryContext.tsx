import React from 'react';
import { getApiErrorMessage } from '@/src/core/api/client';
import { getTransactionsSummary } from '@/src/features/transactions/api/transactions';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { type MonthBucket, currentMonthKey } from '@/src/features/transactions/utils/aggregate';

interface TransactionSummaryContextValue {
  sixMonthBuckets: MonthBucket[];
  heroBucket: MonthBucket;
  summaryLoading: boolean;
  /** Set when the summary request failed, so the chart can say so instead of going blank. */
  summaryError: string | null;
  refresh: () => Promise<void>;
}

const TransactionSummaryContext = React.createContext<TransactionSummaryContextValue | null>(null);

export function TransactionSummaryProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAppAuth();

  const [sixMonthBuckets, setSixMonthBuckets] = React.useState<MonthBucket[]>([]);
  const [summaryLoading, setSummaryLoading] = React.useState(true);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await getTransactionsSummary();
      setSixMonthBuckets(
        response.six_month_buckets.map(item => ({
          key: item.key,
          year: item.year,
          month: item.month,
          revenue: item.revenue,
          expenses: item.expenses,
          profit: item.profit,
          transactions: [],
        }))
      );
    } catch (err) {
      // Was swallowed entirely, with the chart left blank and nothing to say why - which is
      // indistinguishable from "this month has no transactions". Keep the chart area, but
      // let it report the failure and offer a retry.
      setSummaryError(getApiErrorMessage(err, 'error.loadSummaryFailed'));
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (isLoaded && isSignedIn) load();
  }, [isLoaded, isSignedIn, load]);

  const heroBucket = React.useMemo<MonthBucket>(() => {
    const key = currentMonthKey();
    const empty: MonthBucket = {
      key,
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      revenue: 0, expenses: 0, profit: 0, transactions: [],
    };
    return sixMonthBuckets.find(b => b.key === key)
      ?? sixMonthBuckets[sixMonthBuckets.length - 1]
      ?? empty;
  }, [sixMonthBuckets]);

  const value = React.useMemo<TransactionSummaryContextValue>(
    () => ({ sixMonthBuckets, heroBucket, summaryLoading, summaryError, refresh: load }),
    [sixMonthBuckets, heroBucket, summaryLoading, summaryError, load]
  );

  return (
    <TransactionSummaryContext.Provider value={value}>
      {children}
    </TransactionSummaryContext.Provider>
  );
}

export function useTransactionSummaryContext(): TransactionSummaryContextValue {
  const ctx = React.useContext(TransactionSummaryContext);
  if (!ctx) throw new Error('useTransactionSummaryContext must be used inside TransactionSummaryProvider');
  return ctx;
}
