import React from 'react';
import type { Transaction } from '@/src/shared/types';
import { getTransactions } from '@/src/features/transactions/api/transactions';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useOnReconnect } from '@/src/core/context';
import { useTranslation } from 'react-i18next';

/**
 * Rows per page. Ten was under a screenful: a hard fling covers several screens, so the list
 * ran out of content on every throw no matter how fast the fetch came back. Forty is roughly
 * three screens - enough that the next page lands before the reader catches up - and still a
 * small response. The server accepts up to 500.
 */
const PAGE_SIZE = 40;

/**
 * Filters applied by the server, not to the rows already on the phone. Filtering loaded rows
 * only ever searched the pages scrolled through so far, so an expense from four months back
 * could not be found by its supplier until the reader had scrolled down to it.
 */
export interface ServerTransactionFilters {
  categoryId: number | null;
  supplierId: number | null;
}

const NO_FILTERS: ServerTransactionFilters = { categoryId: null, supplierId: null };

interface PaginatedTransactionContextValue {
  transactions: Transaction[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  serverFilters: ServerTransactionFilters;
  setCategoryFilter: (id: number | null) => void;
  setSupplierFilter: (id: number | null) => void;
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
  const [serverFilters, setServerFilters] = React.useState<ServerTransactionFilters>(NO_FILTERS);
  const filtersRef = React.useRef<ServerTransactionFilters>(NO_FILTERS);
  // Bumped whenever the filters change, so a page requested under the old filters is
  // dropped instead of being appended to (or replacing) the new list.
  const generationRef = React.useRef(0);
  const offsetRef = React.useRef(0);
  const hasMoreRef = React.useRef(true);
  const loadingMoreRef = React.useRef(false);
  const loadingRef = React.useRef(true);

  const _fetch = React.useCallback(async (offset: number): Promise<Transaction[] | null> => {
    const { categoryId, supplierId } = filtersRef.current;
    try {
      return await getTransactions({
        limit: PAGE_SIZE,
        offset,
        categoryId: categoryId ?? undefined,
        supplierId: supplierId ?? undefined,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, tRef.current('error.loadFailed')));
      return null;
    }
  }, []);

  const initialLoad = React.useCallback(async () => {
    const generation = generationRef.current;
    setLoading(true); loadingRef.current = true;
    setError(null);
    const result = await _fetch(0);
    if (generation !== generationRef.current) return;
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

  useOnReconnect(() => {
    if (isLoaded && isSignedIn) initialLoad();
  });

  // Drop the previous account's rows on sign-out, so the next account never sees them.
  React.useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    generationRef.current += 1;
    filtersRef.current = NO_FILTERS;
    setServerFilters(NO_FILTERS);
    setTransactions([]);
    setLoading(true); loadingRef.current = true;
    setLoadingMore(false); loadingMoreRef.current = false;
    setError(null);
    setHasMore(true); hasMoreRef.current = true;
    offsetRef.current = 0;
  }, [isLoaded, isSignedIn]);

  const loadMore = React.useCallback(async () => {
    if (!hasMoreRef.current || loadingMoreRef.current || loadingRef.current) return;
    const generation = generationRef.current;
    setLoadingMore(true); loadingMoreRef.current = true;
    const result = await _fetch(offsetRef.current);
    if (generation !== generationRef.current) return;
    if (result !== null) {
      setTransactions(prev => [...prev, ...result]);
      offsetRef.current += result.length;
      const more = result.length === PAGE_SIZE;
      setHasMore(more); hasMoreRef.current = more;
    }
    setLoadingMore(false); loadingMoreRef.current = false;
  }, [_fetch]);

  const refresh = React.useCallback(async () => {
    const generation = generationRef.current;
    setError(null);
    const result = await _fetch(0);
    if (generation !== generationRef.current) return;
    if (result !== null) {
      setTransactions(result);
      offsetRef.current = result.length;
      const more = result.length === PAGE_SIZE;
      setHasMore(more); hasMoreRef.current = more;
    }
  }, [_fetch]);

  /**
   * Starts the list over from the first page under the new filters. The rows already loaded
   * stay on screen until the answer arrives - the list screen narrows them by the same
   * filter meanwhile - so picking a filter never blanks the screen.
   */
  const applyFilters = React.useCallback((next: ServerTransactionFilters) => {
    const prev = filtersRef.current;
    if (prev.categoryId === next.categoryId && prev.supplierId === next.supplierId) return;
    generationRef.current += 1;
    filtersRef.current = next;
    setServerFilters(next);
    setLoadingMore(false); loadingMoreRef.current = false;
    if (isLoaded && isSignedIn) initialLoad();
  }, [isLoaded, isSignedIn, initialLoad]);

  const setCategoryFilter = React.useCallback(
    (id: number | null) => applyFilters({ ...filtersRef.current, categoryId: id }),
    [applyFilters],
  );
  const setSupplierFilter = React.useCallback(
    (id: number | null) => applyFilters({ ...filtersRef.current, supplierId: id }),
    [applyFilters],
  );

  const value = React.useMemo<PaginatedTransactionContextValue>(
    () => ({
      transactions, loading, loadingMore, hasMore, error, loadMore, refresh,
      serverFilters, setCategoryFilter, setSupplierFilter,
    }),
    [transactions, loading, loadingMore, hasMore, error, loadMore, refresh,
      serverFilters, setCategoryFilter, setSupplierFilter]
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
