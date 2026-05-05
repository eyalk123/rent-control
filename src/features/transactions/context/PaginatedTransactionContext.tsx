import React from 'react';
import type { Transaction } from '@/src/shared/types';
import { getTransactions } from '@/src/features/transactions/api/transactions';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 10;

interface PaginatedTransactionContextValue {
  transactions: Transaction[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PaginatedTransactionContext = React.createContext<PaginatedTransactionContextValue | null>(null);

export function PaginatedTransactionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAppAuth();
  const { t } = useTranslation();
  const tRef = React.useRef(t);
  tRef.current = t;

  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const offsetRef = React.useRef(0);
  const hasMoreRef = React.useRef(true);
  const loadingMoreRef = React.useRef(false);
  const loadingRef = React.useRef(true);

  const _fetch = React.useCallback(async (offset: number): Promise<Transaction[] | null> => {
    try {
      return await getTransactions({ limit: PAGE_SIZE, offset });
    } catch (err) {
      setError(getApiErrorMessage(err, tRef.current('error.loadFailed')));
      return null;
    }
  }, []);

  const initialLoad = React.useCallback(async () => {
    setLoading(true); loadingRef.current = true;
    setError(null);
    const result = await _fetch(0);
    if (result !== null) {
      setTransactions(result);
      offsetRef.current = result.length;
      const more = result.length === PAGE_SIZE;
      setHasMore(more); hasMoreRef.current = more;
    }
    setLoading(false); loadingRef.current = false;
  }, [_fetch]);

  React.useEffect(() => {
    if (isLoaded && isSignedIn) initialLoad();
  }, [isLoaded, isSignedIn, initialLoad]);

  const loadMore = React.useCallback(async () => {
    if (!hasMoreRef.current || loadingMoreRef.current || loadingRef.current) return;
    setLoadingMore(true); loadingMoreRef.current = true;
    const result = await _fetch(offsetRef.current);
    if (result !== null) {
      setTransactions(prev => [...prev, ...result]);
      offsetRef.current += result.length;
      const more = result.length === PAGE_SIZE;
      setHasMore(more); hasMoreRef.current = more;
    }
    setLoadingMore(false); loadingMoreRef.current = false;
  }, [_fetch]);

  const refresh = React.useCallback(async () => {
    setError(null);
    const result = await _fetch(0);
    if (result !== null) {
      setTransactions(result);
      offsetRef.current = result.length;
      const more = result.length === PAGE_SIZE;
      setHasMore(more); hasMoreRef.current = more;
    }
  }, [_fetch]);

  const value = React.useMemo<PaginatedTransactionContextValue>(
    () => ({ transactions, loading, loadingMore, hasMore, error, loadMore, refresh }),
    [transactions, loading, loadingMore, hasMore, error, loadMore, refresh]
  );

  return (
    <PaginatedTransactionContext.Provider value={value}>
      {children}
    </PaginatedTransactionContext.Provider>
  );
}

export function usePaginatedTransactionContext(): PaginatedTransactionContextValue {
  const ctx = React.useContext(PaginatedTransactionContext);
  if (!ctx) throw new Error('usePaginatedTransactionContext must be used inside PaginatedTransactionProvider');
  return ctx;
}
