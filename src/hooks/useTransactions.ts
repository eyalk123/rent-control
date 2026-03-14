import React from 'react';
import {
  getTransactions,
  type TransactionsListParams,
  getExpenseCategories,
  getSuppliers,
} from '@/src/api';
import type { ExpenseCategory, Supplier, Transaction } from '@/src/types';
import { getApiErrorMessage } from '@/src/api/client';

export function useTransactionsList(params: TransactionsListParams = {}) {
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
        setError(getApiErrorMessage(err, 'Failed to load transactions'));
        setTransactions([]);
      } finally {
        if (forRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [type, propertyId, renterId, search],
  );

  const refreshTransactions = React.useCallback(() => load(true), [load]);

  React.useEffect(() => {
    load(false);
  }, [load]);

  return {
    transactions,
    loading,
    refreshing,
    error,
    refreshTransactions,
  };
}

export function useExpenseCategories() {
  const [categories, setCategories] = React.useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getExpenseCategories();
        if (!cancelled) {
          setCategories(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load categories'));
          setCategories([]);
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
  }, []);

  return { categories, loading, error };
}

export function useSuppliers(categoryId?: number) {
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
        const data = await getSuppliers(categoryId);
        if (!cancelled) {
          setSuppliers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Failed to load suppliers'));
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
  }, [categoryId]);

  return { suppliers, loading, error };
}

