import apiClient from './client';
import { USE_MOCK_API, mockPropertiesApi } from './mock';
import type { Property } from '@/src/types';

export async function getProperties(): Promise<Property[]> {
  if (USE_MOCK_API) return mockPropertiesApi.getProperties();
  const response = await apiClient.get<Property[]>('/properties');
  return response.data;
}

export async function getPropertyById(id: number): Promise<Property> {
  if (USE_MOCK_API) return mockPropertiesApi.getPropertyById(id);
  const response = await apiClient.get<Property>(`/properties/${id}`);
  return response.data;
}

export async function createProperty(data: Partial<Property>): Promise<Property> {
  if (USE_MOCK_API) return mockPropertiesApi.createProperty(data);
  const response = await apiClient.post<Property>('/properties', data);
  return response.data;
}

export async function updateProperty(
  id: number,
  data: Partial<Property>
): Promise<Property> {
  if (USE_MOCK_API) return mockPropertiesApi.updateProperty(id, data);
  const response = await apiClient.patch<Property>(`/properties/${id}`, data);
  return response.data;
}

export async function deleteProperty(id: number): Promise<void> {
  if (USE_MOCK_API) return mockPropertiesApi.deleteProperty(id);
  await apiClient.delete(`/properties/${id}`);
}

export async function uploadPropertyImage(
  id: number,
  formData: FormData
): Promise<Property> {
  if (USE_MOCK_API) return mockPropertiesApi.uploadPropertyImage(id, formData);
  const response = await apiClient.post<Property>(
    `/properties/${id}/image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}
