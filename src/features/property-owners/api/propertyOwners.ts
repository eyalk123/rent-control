import type { TFunction } from 'i18next';
import apiClient from '@/src/core/api/client';
import { USE_MOCK_API, mockPropertyOwnersApi } from '@/src/core/api/mock';
import type { PropertyOwner, PropertyOwnerCreate, PropertyOwnerUpdate } from '@/src/shared/types';

/** A 409 from the owner endpoints: a name already taken, or a delete while properties remain. */
export function isPropertyOwnerConflict(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 409;
}

export async function getPropertyOwners(
  params: { includeInactive?: boolean } = {},
): Promise<PropertyOwner[]> {
  if (USE_MOCK_API) {
    return mockPropertyOwnersApi.getPropertyOwners(params);
  }
  const response = await apiClient.get<PropertyOwner[]>('/property-owners', {
    params: { include_inactive: params.includeInactive },
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getPropertyOwnerById(id: number): Promise<PropertyOwner> {
  if (USE_MOCK_API) {
    return mockPropertyOwnersApi.getPropertyOwnerById(id);
  }
  const response = await apiClient.get<PropertyOwner>(`/property-owners/${id}`);
  return response.data;
}

export async function createPropertyOwner(data: PropertyOwnerCreate): Promise<PropertyOwner> {
  if (USE_MOCK_API) {
    return mockPropertyOwnersApi.createPropertyOwner(data);
  }
  const payload = {
    name: data.name,
    phone: data.phone ?? null,
    email: data.email ?? null,
    notes: data.notes ?? null,
    bank_account: data.bank_account ?? null,
  };
  const response = await apiClient.post<PropertyOwner>('/property-owners', payload);
  return response.data;
}

export async function updatePropertyOwner(
  id: number,
  data: PropertyOwnerUpdate,
): Promise<PropertyOwner> {
  if (USE_MOCK_API) {
    return mockPropertyOwnersApi.updatePropertyOwner(id, data);
  }
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone ?? null;
  if (data.email !== undefined) payload.email = data.email ?? null;
  if (data.notes !== undefined) payload.notes = data.notes ?? null;
  if (data.bank_account !== undefined) payload.bank_account = data.bank_account ?? null;
  if (data.is_active !== undefined) payload.is_active = data.is_active;
  const response = await apiClient.patch<PropertyOwner>(`/property-owners/${id}`, payload);
  return response.data;
}

export async function deletePropertyOwner(id: number): Promise<void> {
  if (USE_MOCK_API) {
    return mockPropertyOwnersApi.deletePropertyOwner(id);
  }
  await apiClient.delete(`/property-owners/${id}`);
}

/** "1 property" / "3 properties". Two keys rather than i18next plurals: this app runs the v3
 *  JSON format, which does not read `_one`/`_other`. */
export function propertyCountLabel(t: TFunction, count: number): string {
  return count === 1
    ? t('propertyOwners.propertyCountOne')
    : t('propertyOwners.propertyCountMany', { count });
}
