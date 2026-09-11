import apiClient from '@/src/core/api/client';
import { USE_MOCK_API, mockPropertyFilesApi } from '@/src/core/api/mock';
import type { PropertyFile } from '@/src/shared/types';

export async function getPropertyFiles(propertyId: number): Promise<PropertyFile[]> {
  if (USE_MOCK_API) return mockPropertyFilesApi.getPropertyFiles(propertyId);
  const response = await apiClient.get<PropertyFile[]>(`/properties/${propertyId}/files`);
  return response.data;
}

export async function bulkCreatePropertyFiles(
  propertyId: number,
  files: { url: string; label: string }[]
): Promise<PropertyFile[]> {
  if (USE_MOCK_API) return mockPropertyFilesApi.bulkCreatePropertyFiles(propertyId, files);
  const response = await apiClient.post<PropertyFile[]>(
    `/properties/${propertyId}/files/bulk`,
    files
  );
  return response.data;
}

export async function deletePropertyFile(
  propertyId: number,
  fileId: number
): Promise<void> {
  if (USE_MOCK_API) return mockPropertyFilesApi.deletePropertyFile(propertyId, fileId);
  await apiClient.delete(`/properties/${propertyId}/files/${fileId}`);
}
