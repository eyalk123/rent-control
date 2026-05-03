import type { Property } from '@/src/shared/types';
import { getProperties } from '@/src/features/properties/api/properties';
import { createDataContext } from '@/src/core/context/createDataContext';

export interface PropertyContextType {
  properties: Property[];
  loading: boolean;
  error: string | null;
  refreshProperties: () => Promise<void>;
}

const { Provider: PropertyProvider, useData } = createDataContext<Property>(
  getProperties,
  'Property',
);

export { PropertyProvider };

export function usePropertyContext(): PropertyContextType {
  const { data, loading, error, refresh } = useData();
  return { properties: data, loading, error, refreshProperties: refresh };
}
