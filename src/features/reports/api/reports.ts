import * as FileSystem from 'expo-file-system/legacy';
import i18n from 'i18next';

import apiClient from '@/src/core/api/client';

export interface ReportExport {
  id: number;
  report_type: 'income_expense' | 'expense_log';
  year: number;
  format: 'pdf' | 'csv';
  created_at: string;
}

export async function getReportHistory(): Promise<ReportExport[]> {
  const response = await apiClient.get<ReportExport[]>('/reports/history');
  return response.data;
}

export async function deleteReportExport(id: number): Promise<void> {
  await apiClient.delete(`/reports/history/${id}`);
}

type ReportFormat = 'pdf' | 'csv';

/** The report is rendered in the language the app is currently in, right-to-left included. */
function reportLang(): 'en' | 'he' {
  return i18n.language?.startsWith('he') ? 'he' : 'en';
}

async function downloadAndShare(
  endpoint: string,
  year: number,
  format: ReportFormat,
  filename: string,
): Promise<void> {
  const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';

  const response = await apiClient.get<ArrayBuffer>(endpoint, {
    params: { year, format, lang: reportLang() },
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  const base64 = arrayBufferToBase64(response.data);
  const uri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const Sharing = await import('expo-sharing');
  await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename });
}

export async function downloadIncomeExpenseReport(year: number, format: ReportFormat): Promise<void> {
  await downloadAndShare(
    '/reports/income-expense',
    year,
    format,
    `income-expense-${year}.${format}`,
  );
}

export async function downloadExpenseLogReport(year: number, format: ReportFormat): Promise<void> {
  await downloadAndShare(
    '/reports/expense-log',
    year,
    format,
    `expense-log-${year}.${format}`,
  );
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
