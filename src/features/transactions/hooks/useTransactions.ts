import React from 'react';
import {
  type TransactionsListParams,
  getExpenseCategories,
} from '@/src/features/transactions/api/transactions';
import { getSuppliers } from '@/src/features/suppliers/api/suppliers';
import type { ExpenseCategory, Supplier } from '@/src/shared/types';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useTranslation } from 'react-i18next';
import { useTransactionContext } from '@/src/features/transactions/context/TransactionContext';

export function useTransactionsList(_params: TransactionsListParams = {}) {
  const { transactions, loading, error, refreshTransactions: contextRefresh } = useTransactionContext();
  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const refreshTransactions = React.useCallback(async () => {
    setRefreshing(true);
    await contextRefresh();
    setRefreshing(false);
  }, [contextRefresh]);

  return {
    transactions,
    loading,
    refreshing,
    error,
    refreshTransactions,
    retryLoad: contextRefresh,
  };
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
