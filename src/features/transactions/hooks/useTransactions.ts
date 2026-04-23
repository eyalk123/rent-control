import React from 'react';
import {
  getTransactions,
  type TransactionsListParams,
  getExpenseCategories,
} from '@/src/features/transactions/api/transactions';
import { getSuppliers } from '@/src/features/suppliers/api/suppliers';
import type { ExpenseCategory, Supplier, Transaction } from '@/src/shared/types';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useTranslation } from 'react-i18next';

export function useTransactionsList(params: TransactionsListParams = {}) {
  const { t } = useTranslation();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const type = params.type;
  const propertyId = params.propertyId;
  const renterId = params.renterId;
  const search = params.search;

  const load = React.useCallback(
    async (forRefresh = false) => {
      if (forRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await getTransactions({ type, propertyId, renterId, search });
        setTransactions(data);
      } catch (err) {
        setError(getApiErrorMessage(err, t('error.loadFailed')));
        setTransactions([]);
      } finally {
        if (forRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [type, propertyId, renterId, search, t],
  );

  const refreshTransactions = React.useCallback(() => load(true), [load]);
  const retryLoad = React.useCallback(() => load(false), [load]);

  React.useEffect(() => {
    load(false);
  }, [load]);

  return {
    transactions,
    loading,
    refreshing,
    error,
    refreshTransactions,
    retryLoad,
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
