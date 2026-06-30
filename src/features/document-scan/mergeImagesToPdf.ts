import * as FileSystem from 'expo-file-system/legacy';
import { PDFDocument } from 'pdf-lib';
import type { PickedFile } from './api/extractLease';

/** Merge one or more captured/picked images into a single PDF, one image per page, written to
 *  the cache directory. Used so a multi-page photographed lease is uploaded — and later stored
 *  as the contract — as one document. pdf-lib only embeds JPEG/PNG; the camera/picker emit JPEG. */
export async function mergeImagesToPdf(pages: PickedFile[], fileName = 'lease.pdf'): Promise<PickedFile> {
  const pdf = await PDFDocument.create();
  for (const page of pages) {
    const base64 = await FileSystem.readAsStringAsync(page.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const type = page.mimeType.toLowerCase();
    const embedded = type.includes('png') ? await pdf.embedPng(base64) : await pdf.embedJpg(base64);
    const sheet = pdf.addPage([embedded.width, embedded.height]);
    sheet.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
  }
  const outBase64 = await pdf.saveAsBase64();
  const outUri = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(outUri, outBase64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { localUri: outUri, name: fileName, mimeType: 'application/pdf' };
}
