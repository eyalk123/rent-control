import React from 'react';
import {
  type TransactionsListParams,
  getExpenseCategories,
  getTransactions,
} from '@/src/features/transactions/api/transactions';
import { getSuppliers } from '@/src/features/suppliers/api/suppliers';
import type { ExpenseCategory, Supplier, Transaction } from '@/src/shared/types';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/src/core/auth/AuthContext';

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

export function useSuppliers(categoryIds: number[] = []) {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  // Stable key so the effect doesn't refetch on every render (the prop array is
  // a fresh reference each render, e.g. from RHF `watch`).
  const categoryKey = React.useMemo(
    () => [...new Set(categoryIds)].sort((a, b) => a - b).join(','),
    [categoryIds],
  );

  React.useEffect(() => {
    const ids = categoryKey ? categoryKey.split(',').map(Number) : [];
    if (ids.length === 0) {
      setSuppliers([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          ids.map((id) =>
            getSuppliers({ categoryId: id, includeInactive: false }),
          ),
        );
        // Merge + dedupe by supplier id (a supplier can match several categories).
        const merged = new Map<number, Supplier>();
        results.flat().forEach((s) => merged.set(s.id, s));
        if (!cancelled) {
          setSuppliers([...merged.values()]);
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
  }, [categoryKey, t]);

  return { suppliers, loading, error };
}
