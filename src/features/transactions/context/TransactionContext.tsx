import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Transaction } from '@/src/shared/types';
import { getTransactions } from '@/src/features/transactions/api/transactions';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useTranslation } from 'react-i18next';

export interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAppAuth();
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (err) {
      setError(getApiErrorMessage(err, t('error.loadFailed')));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      refreshTransactions();
    }
  }, [isLoaded, isSignedIn, refreshTransactions]);

  return (
    <TransactionContext.Provider value={{ transactions, loading, error, refreshTransactions }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactionContext(): TransactionContextType {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactionContext must be used within a TransactionProvider');
  }
  return context;
}
