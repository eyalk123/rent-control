import apiClient from '@/src/core/api/client';
import type { LeaseExtraction } from '../types';

export interface PickedFile {
  localUri: string;
  name: string;
  mimeType: string;
}

interface ExtractLeaseResponse {
  log_id: number;
  extraction: LeaseExtraction;
}

/** Upload a lease (PDF / DOCX / image) and get a structured property + renter draft plus
 *  the audit-log id to reference on submit. The backend processes the file in-memory and
 *  discards it; nothing is stored. */
export async function extractLease(file: PickedFile): Promise<{ logId: number; extraction: LeaseExtraction }> {
  const form = new FormData();
  // React Native's FormData takes a {uri,name,type} object for file parts.
  form.append('file', {
    uri: file.localUri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
  const { data } = await apiClient.post<ExtractLeaseResponse>('/extract/lease', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // Vision extraction on a multi-page lease can take a while — override the 10s default.
    timeout: 120000,
  });
  return { logId: data.log_id, extraction: data.extraction };
}
