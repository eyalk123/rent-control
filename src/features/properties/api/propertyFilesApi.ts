import apiClient from '@/src/core/api/client';
import type { PropertyFile } from '@/src/shared/types';

export async function getPropertyFiles(propertyId: number): Promise<PropertyFile[]> {
  const response = await apiClient.get<PropertyFile[]>(`/properties/${propertyId}/files`);
  return response.data;
}

export async function bulkCreatePropertyFiles(
  propertyId: number,
  files: { url: string; label: string }[]
): Promise<PropertyFile[]> {
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
  await apiClient.delete(`/properties/${propertyId}/files/${fileId}`);
}
