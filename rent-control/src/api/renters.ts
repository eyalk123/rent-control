import apiClient from './client';
import { USE_MOCK_API, mockRentersApi } from './mock';
import type { Renter, RenterCreate, RenterUpdate } from '@/src/types';

export async function getRenters(): Promise<Renter[]> {
  if (USE_MOCK_API) return mockRentersApi.getRenters();
  const response = await apiClient.get<Renter[]>('/renters');
  return response.data;
}

export async function getRenterById(id: number): Promise<Renter> {
  if (USE_MOCK_API) return mockRentersApi.getRenterById(id);
  const response = await apiClient.get<Renter>(`/renters/${id}`);
  return response.data;
}

function sanitizeRenterCreate(data: RenterCreate): RenterCreate {
  const {
    property_id,
    first_name,
    last_name,
    phone,
    email,
    monthly_rent,
    lease_start,
    lease_end,
  } = data;
  return {
    property_id: property_id ?? null,
    first_name,
    last_name,
    phone,
    email,
    monthly_rent,
    lease_start,
    lease_end,
  };
}

function sanitizeRenterUpdate(data: RenterUpdate): Record<string, unknown> {
  const allowed = [
    'property_id',
    'first_name',
    'last_name',
    'phone',
    'email',
    'monthly_rent',
    'lease_start',
    'lease_end',
  ];
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    const val = data[key as keyof RenterUpdate];
    if (val !== undefined) out[key] = val;
  }
  return out;
}

export async function createRenter(data: RenterCreate): Promise<Renter> {
  if (USE_MOCK_API) return mockRentersApi.createRenter(data);
  const payload = sanitizeRenterCreate(data);
  const response = await apiClient.post<Renter>('/renters', payload);
  return response.data;
}

export async function updateRenter(
  id: number,
  data: RenterUpdate
): Promise<Renter> {
  if (USE_MOCK_API) return mockRentersApi.updateRenter(id, data);
  const payload = sanitizeRenterUpdate(data);
  const response = await apiClient.patch<Renter>(`/renters/${id}`, payload);
  return response.data;
}

export async function deleteRenter(id: number): Promise<void> {
  if (USE_MOCK_API) return mockRentersApi.deleteRenter(id);
  await apiClient.delete(`/renters/${id}`);
}
