import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useTranslation } from 'react-i18next';

export interface DataContextValue<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function createDataContext<T>(
  fetcher: () => Promise<T[]>,
  displayName: string,
) {
  const Context = createContext<DataContextValue<T> | undefined>(undefined);

  function Provider({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn } = useAppAuth();
    const { t } = useTranslation();
    const tRef = useRef(t);
    tRef.current = t;
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        setData(result);
      } catch (err) {
        setError(getApiErrorMessage(err, tRef.current('error.loadFailed')));
        setData([]);
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      if (isLoaded && isSignedIn) {
        refresh();
      }
    }, [isLoaded, isSignedIn, refresh]);

    const value = useMemo(
      () => ({ data, loading, error, refresh }),
      [data, loading, error, refresh],
    );

    return (
      <Context.Provider value={value}>
        {children}
      </Context.Provider>
    );
  }

  function useData(): DataContextValue<T> {
    const ctx = useContext(Context);
    if (ctx === undefined) {
      throw new Error(`use${displayName} must be used within a ${displayName}Provider`);
    }
    return ctx;
  }

  return { Provider, useData };
}
