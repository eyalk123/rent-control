import type { Transaction } from '@/src/shared/types';
import { getTransactions } from '@/src/features/transactions/api/transactions';
import { createDataContext } from '@/src/core/context/createDataContext';

export interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
}

const { Provider: TransactionProvider, useData } = createDataContext<Transaction>(getTransactions, 'Transaction');

export { TransactionProvider };

export function useTransactionContext(): TransactionContextType {
  const { data, loading, error, refresh } = useData();
  return { transactions: data, loading, error, refreshTransactions: refresh };
}
