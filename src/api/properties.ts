import apiClient from './client';
import { USE_MOCK_API, mockPropertiesApi } from './mock';
import type { Property, PropertyCreate, PropertyUpdate } from '@/src/types';

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

function sanitizePropertyCreate(data: PropertyCreate): PropertyCreate {
  const { address, city, zip_code, type, sq_ft, purchase_price, image_url } = data;
  return { address, city, zip_code, type, sq_ft, purchase_price, image_url };
}

function sanitizePropertyUpdate(data: PropertyUpdate): Record<string, unknown> {
  const allowed = ['address', 'city', 'zip_code', 'type', 'sq_ft', 'purchase_price', 'image_url'];
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    const val = data[key as keyof PropertyUpdate];
    if (val !== undefined) out[key] = val;
  }
  return out;
}

export async function createProperty(data: PropertyCreate): Promise<Property> {
  if (USE_MOCK_API) return mockPropertiesApi.createProperty(data);
  const payload = sanitizePropertyCreate(data);
  const response = await apiClient.post<Property>('/properties', payload);
  return response.data;
}

export async function updateProperty(
  id: number,
  data: PropertyUpdate
): Promise<Property> {
  if (USE_MOCK_API) return mockPropertiesApi.updateProperty(id, data);
  const payload = sanitizePropertyUpdate(data);
  const response = await apiClient.patch<Property>(`/properties/${id}`, payload);
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
  // Do NOT set Content-Type; let axios set it with boundary for multipart/form-data
  const response = await apiClient.post<Property>(
    `/properties/${id}/image`,
    formData
  );
  return response.data;
}
