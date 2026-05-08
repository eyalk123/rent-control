import React from 'react';
import { getTransactionsSummary } from '@/src/features/transactions/api/transactions';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { type MonthBucket, currentMonthKey } from '@/src/features/transactions/utils/aggregate';

interface TransactionSummaryContextValue {
  sixMonthBuckets: MonthBucket[];
  heroBucket: MonthBucket;
  summaryLoading: boolean;
  refresh: () => Promise<void>;
}

const TransactionSummaryContext = React.createContext<TransactionSummaryContextValue | null>(null);

export function TransactionSummaryProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAppAuth();

  const [sixMonthBuckets, setSixMonthBuckets] = React.useState<MonthBucket[]>([]);
  const [summaryLoading, setSummaryLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setSummaryLoading(true);
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
    } catch {
      // silent — chart shows empty state
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
    () => ({ sixMonthBuckets, heroBucket, summaryLoading, refresh: load }),
    [sixMonthBuckets, heroBucket, summaryLoading, load]
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
