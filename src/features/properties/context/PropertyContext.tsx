import { useMemo } from 'react';
import type { Property } from '@/src/shared/types';
import { getProperties } from '@/src/features/properties/api/properties';
import { createDataContext } from '@/src/core/context/createDataContext';
import { useSubscription } from '@/src/features/subscription/SubscriptionContext';

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

/**
 * The properties the account can actually open — every one but those over the plan's limit.
 *
 * For pickers, filters and anything that links into a property. A locked property arrives
 * from the API as a stub and every read of it is refused, so offering it anywhere but the
 * properties list (which shows it as a locked row with Upgrade and Delete) would lead to a
 * 402. `isLocked` answers false while enforcement is off, matching the server.
 */
export function useAccessibleProperties(): PropertyContextType {
  const context = usePropertyContext();
  const { isLocked } = useSubscription();
  const properties = useMemo(
    () => context.properties.filter((p) => !isLocked(p.id)),
    [context.properties, isLocked],
  );
  return { ...context, properties };
}
