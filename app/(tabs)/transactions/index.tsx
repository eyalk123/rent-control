import { TransactionsListScreen } from '@/src/features/transactions/screens/TransactionsListScreen';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';

export default function TransactionsTab() {
  return <DevProfiler id="TransactionsListScreen"><TransactionsListScreen /></DevProfiler>;
}
