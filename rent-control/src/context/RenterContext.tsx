import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Renter } from '@/src/types';
import { getRenters } from '@/src/api/renters';
import { getApiErrorMessage } from '@/src/api/client';

export interface RenterContextType {
  renters: Renter[];
  loading: boolean;
  error: string | null;
  refreshRenters: () => Promise<void>;
}

const RenterContext = createContext<RenterContextType | undefined>(undefined);

export function RenterProvider({ children }: { children: React.ReactNode }) {
  const [renters, setRenters] = useState<Renter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshRenters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRenters();
      setRenters(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load renters'));
      setRenters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRenters();
  }, [refreshRenters]);

  return (
    <RenterContext.Provider
      value={{ renters, loading, error, refreshRenters }}
    >
      {children}
    </RenterContext.Provider>
  );
}

export function useRenterContext(): RenterContextType {
  const context = useContext(RenterContext);
  if (context === undefined) {
    throw new Error('useRenterContext must be used within a RenterProvider');
  }
  return context;
}
