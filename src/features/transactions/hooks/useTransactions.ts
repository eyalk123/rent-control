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

/**
 * Every active supplier. The expense form used to load only the suppliers of the chosen
 * categories, so a supplier outside them could not be picked at all; now it shows all of
 * them, the matching ones first, and warns on save instead (see SupplierPicker).
 */
export function useSuppliers() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadCount, setReloadCount] = React.useState(0);
  const reload = React.useCallback(() => setReloadCount((n) => n + 1), []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await getSuppliers({ includeInactive: false });
        if (!cancelled) setSuppliers(list);
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
  }, [reloadCount, t]);

  return { suppliers, loading, error, reload };
}
