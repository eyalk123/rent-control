import apiClient from './client';
import { USE_MOCK_API, mockRentersApi } from './mock';
import type { Renter } from '@/src/types';

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

export async function createRenter(data: Partial<Renter>): Promise<Renter> {
  if (USE_MOCK_API) return mockRentersApi.createRenter(data);
  const response = await apiClient.post<Renter>('/renters', data);
  return response.data;
}

export async function updateRenter(
  id: number,
  data: Partial<Renter>
): Promise<Renter> {
  if (USE_MOCK_API) return mockRentersApi.updateRenter(id, data);
  const response = await apiClient.patch<Renter>(`/renters/${id}`, data);
  return response.data;
}

export async function deleteRenter(id: number): Promise<void> {
  if (USE_MOCK_API) return mockRentersApi.deleteRenter(id);
  await apiClient.delete(`/renters/${id}`);
}
