import type { Renter } from '@/src/shared/types';
import { getRenters } from '@/src/features/renters/api/renters';
import { createDataContext } from '@/src/core/context/createDataContext';

export interface RenterContextType {
  renters: Renter[];
  loading: boolean;
  error: string | null;
  refreshRenters: () => Promise<void>;
}

const { Provider: RenterProvider, useData } = createDataContext<Renter>(getRenters, 'Renter');

export { RenterProvider };

export function useRenterContext(): RenterContextType {
  const { data, loading, error, refresh } = useData();
  return { renters: data, loading, error, refreshRenters: refresh };
}
