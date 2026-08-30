import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
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

type State<T> = { data: T[]; loading: boolean; error: string | null };
type Action<T> =
  | { type: 'loading' }
  | { type: 'success'; data: T[] }
  | { type: 'error'; message: string };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'loading': return { ...state, loading: true, error: null };
    case 'success': return { data: action.data, loading: false, error: null };
    // Keep whatever we already had. A failed refresh — a tunnel, a lift, a dropped packet —
    // used to blank the list the user was reading. Screens render the error instead of the
    // list only when there is nothing to show (`error && items.length === 0`), so holding
    // the data here is what makes that guard mean what it says.
    case 'error':   return { ...state, loading: false, error: action.message };
  }
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
    const [state, dispatch] = useReducer(reducer<T>, { data: [], loading: true, error: null });

    const refresh = useCallback(async () => {
      dispatch({ type: 'loading' });
      try {
        const data = await fetcher();
        dispatch({ type: 'success', data });
      } catch (err) {
        dispatch({ type: 'error', message: getApiErrorMessage(err, tRef.current('error.loadFailed')) });
      }
    }, []);

    useEffect(() => {
      if (isLoaded && isSignedIn) {
        refresh();
      }
    }, [isLoaded, isSignedIn, refresh]);

    const value = useMemo(
      () => ({ data: state.data, loading: state.loading, error: state.error, refresh }),
      [state, refresh],
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
