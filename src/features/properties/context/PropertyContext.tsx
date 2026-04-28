import type { Property } from '@/src/shared/types';
import { getProperties } from '@/src/features/properties/api/properties';
import { getRenters } from '@/src/features/renters/api/renters';
import { createDataContext } from '@/src/core/context/createDataContext';

export interface PropertyContextType {
  properties: Property[];
  loading: boolean;
  error: string | null;
  refreshProperties: () => Promise<void>;
}

async function fetchEnrichedProperties(): Promise<Property[]> {
  const [propertiesResult, rentersResult] = await Promise.allSettled([
    getProperties(),
    getRenters(),
  ]);
  if (propertiesResult.status === 'rejected') throw propertiesResult.reason;
  const renters = rentersResult.status === 'fulfilled' ? rentersResult.value : [];
  return propertiesResult.value.map((p) => ({
    ...p,
    hasRenters: renters.some((r) => r.property_id === p.id),
  }));
}

const { Provider: PropertyProvider, useData } = createDataContext<Property>(
  fetchEnrichedProperties,
  'Property',
);

export { PropertyProvider };

export function usePropertyContext(): PropertyContextType {
  const { data, loading, error, refresh } = useData();
  return { properties: data, loading, error, refreshProperties: refresh };
}
