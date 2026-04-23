import React from 'react';
import { getSuppliers } from '@/src/features/suppliers/api/suppliers';
import type { Supplier } from '@/src/shared/types';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useTranslation } from 'react-i18next';

export function useSuppliersList() {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (forRefresh = false) => {
    if (forRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getSuppliers({ includeInactive: false });
      setSuppliers(data);
    } catch (err) {
      setError(getApiErrorMessage(err, t('error.loadFailed')));
      setSuppliers([]);
    } finally {
      if (forRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const refreshSuppliers = React.useCallback(() => load(true), [load]);

  React.useEffect(() => {
    load(false);
  }, [load]);

  return {
    suppliers,
    loading,
    refreshing,
    error,
    refreshSuppliers,
    retryLoad: () => load(false),
  };
}
