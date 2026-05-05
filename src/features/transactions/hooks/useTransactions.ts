import React from 'react';
import {
  type TransactionsListParams,
  getExpenseCategories,
  getTransactions,
  getTransactionsSummary,
} from '@/src/features/transactions/api/transactions';
import { getSuppliers } from '@/src/features/suppliers/api/suppliers';
import type { ExpenseCategory, Supplier, Transaction } from '@/src/shared/types';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { type MonthBucket, currentMonthKey } from '@/src/features/transactions/utils/aggregate';

export function useTransactionsSummary() {
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

  return { sixMonthBuckets, heroBucket, summaryLoading, refreshSummary: load };
}

export function useTransactionsList(params: TransactionsListParams = {}) {
  const { isLoaded, isSignedIn } = useAppAuth();
  const { t } = useTranslation();
  const tRef = React.useRef(t);
  tRef.current = t;

  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { propertyId, renterId } = params;

  const load = React.useCallback(async () => {
    try {
      const data = await getTransactions({ propertyId, renterId });
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, tRef.current('error.loadFailed')));
    }
  }, [propertyId, renterId]);

  const initialLoad = React.useCallback(async () => {
    setLoading(true);
    await load();
    setLoading(false);
  }, [load]);

  React.useEffect(() => {
    if (isLoaded && isSignedIn) initialLoad();
  }, [isLoaded, isSignedIn, initialLoad]);

  const refreshTransactions = React.useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { transactions, loading, refreshing, error, refreshTransactions, retryLoad: initialLoad };
}

export function useExpenseCategories() {
  const { t } = useTranslation();
  const [categories, setCategories] = React.useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpenseCategories();
      setCategories(data);
    } catch (err) {
      setError(getApiErrorMessage(err, t('error.loadFailed')));
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    load();
  }, [load]);

  return { categories, loading, error, refreshCategories: load };
}

export function useSuppliers(categoryId?: number) {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!categoryId) {
      setSuppliers([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSuppliers({
          categoryId,
          includeInactive: false,
        });
        if (!cancelled) {
          setSuppliers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, t('error.loadFailed')));
          setSuppliers([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categoryId, t]);

  return { suppliers, loading, error };
}
