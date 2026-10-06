import React from 'react';
import { useTranslation } from 'react-i18next';
import { getPropertyOwners } from '@/src/features/property-owners/api/propertyOwners';
import { getApiErrorMessage } from '@/src/core/api/client';
import type { PropertyOwner } from '@/src/shared/types';

/** Every owner, inactive included: a property may still point at one, and its name must
 *  stay shown. `loaded` is false until the first fetch succeeds. */
export function usePropertyOwnersList() {
  const { t } = useTranslation();
  const [owners, setOwners] = React.useState<PropertyOwner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      setOwners(await getPropertyOwners({ includeInactive: true }));
      setLoaded(true);
    } catch (err) {
      setError(getApiErrorMessage(err, t('error.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  React.useEffect(() => {
    load();
  }, [load]);

  const retryLoad = React.useCallback(() => {
    setLoading(true);
    return load();
  }, [load]);

  return { owners, loading, loaded, error, refreshOwners: load, retryLoad };
}
