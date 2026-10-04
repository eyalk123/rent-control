import apiClient from '@/src/core/api/client';
import { USE_MOCK_API, mockExtractReceipt } from '@/src/core/api/mock';
import type { PickedFile } from './extractLease';
import type { ReceiptExtraction } from '../types';

interface ExtractReceiptResponse {
  log_id: number;
  extraction: ReceiptExtraction;
}

/** Upload a receipt (photo or PDF) and get an expense draft plus the audit-log id to
 *  reference on submit. `matchProperty` is false when the form already knows the property,
 *  so the backend does not send the owner's properties to the model at all. The file is
 *  processed in memory and discarded; keeping it as the expense's receipt is a separate
 *  upload. */
export async function extractReceipt(
  file: PickedFile,
  matchProperty: boolean,
): Promise<{ logId: number; extraction: ReceiptExtraction }> {
  if (USE_MOCK_API) return mockExtractReceipt(matchProperty);
  const form = new FormData();
  // React Native's FormData takes a {uri,name,type} object for file parts.
  form.append('file', { uri: file.localUri, name: file.name, type: file.mimeType } as unknown as Blob);
  form.append('match_property', String(matchProperty));
  const { data } = await apiClient.post<ExtractReceiptResponse>('/extract/receipt', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // A single image is quicker than a lease, but still a vision call — well past the 10s
    // default, and a phone upload over mobile data adds to it.
    timeout: 90000,
  });
  return { logId: data.log_id, extraction: data.extraction };
}
