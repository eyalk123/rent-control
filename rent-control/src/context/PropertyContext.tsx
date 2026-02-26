import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Property } from '@/src/types';
import { getProperties } from '@/src/api/properties';

export interface PropertyContextType {
  properties: Property[];
  loading: boolean;
  error: string | null;
  refreshProperties: () => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(
  undefined
);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load properties'
      );
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProperties();
  }, [refreshProperties]);

  return (
    <PropertyContext.Provider
      value={{ properties, loading, error, refreshProperties }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function usePropertyContext(): PropertyContextType {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('usePropertyContext must be used within a PropertyProvider');
  }
  return context;
}
