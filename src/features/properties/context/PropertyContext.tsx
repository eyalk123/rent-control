import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Property } from '@/src/shared/types';
import { getProperties } from '@/src/features/properties/api/properties';
import { getRenters } from '@/src/features/renters/api/renters';
import { getApiErrorMessage } from '@/src/core/api/client';

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
      const propertiesData = await getProperties();
      let rentersData: { property_id: number | null }[] = [];
      try {
        rentersData = await getRenters();
      } catch {
        // Renters fetch failed; occupancy will fall back to renters?.length (vacant)
      }
      const enriched = propertiesData.map((p) => ({
        ...p,
        hasRenters: rentersData.some((r) => r.property_id === p.id),
      }));
      setProperties(enriched);
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Failed to load properties')
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
