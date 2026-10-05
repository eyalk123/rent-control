import * as FileSystem from 'expo-file-system/legacy';
import { revenueBasisDefault } from '@/src/shared/utils/capabilities';
import i18n from 'i18next';

import apiClient from '@/src/core/api/client';

export interface ReportExport {
  id: number;
  report_type: 'income_expense' | 'expense_log';
  year: number;
  format: 'pdf' | 'csv';
  /**
   * Which revenue recognition basis produced it. `null` for an expense log (no revenue to
   * recognise) and for anything exported before the choice existed — which was accrual by
   * definition. Shown on the history row so two otherwise-identical reports can be told
   * apart.
   */
  revenue_basis: RevenueBasis | null;
  /**
   * The property owners it was limited to, as typed on the properties (`''` is the
   * no-owner group). `null` means every owner.
   */
  owners: string[] | null;
  /** Shared as a ZIP holding one file per owner. */
  split_by_owner: boolean;
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

/**
 * Which owners a report covers and how it is packaged. `owners` omitted or `null` means
 * every owner; `split` shares a ZIP with one file per owner instead of one grouped file.
 */
export interface OwnerExportOptions {
  owners?: string[] | null;
  split?: boolean;
}

/**
 * Accrual counts December's rent as December income even if it arrived in January; cash
 * counts it when it arrived. Chosen **per report**, next to the language, rather than
 * stored on the account: a stored preference would silently re-interpret history, so the
 * same year's report would say two different things depending on when it was generated.
 */
export type RevenueBasis = 'accrual' | 'cash';

/** The option a country's landlords most likely want — pre-selected, never forced. */
export function defaultRevenueBasis(): RevenueBasis {
  return revenueBasisDefault();
}

/** The report is rendered in the language the app is currently in, right-to-left included. */
function reportLang(): 'en' | 'he' {
  return i18n.language?.startsWith('he') ? 'he' : 'en';
}

async function downloadAndShare(
  endpoint: string,
  year: number,
  format: ReportFormat,
  stem: string,
  { owners, split }: OwnerExportOptions,
  basis?: RevenueBasis,
): Promise<void> {
  const filename = `${stem}.${split ? 'zip' : format}`;
  const mimeType = split ? 'application/zip' : format === 'pdf' ? 'application/pdf' : 'text/csv';

  const response = await apiClient.get<ArrayBuffer>(endpoint, {
    params: {
      year,
      format,
      lang: reportLang(),
      ...(basis ? { basis } : {}),
      ...(owners ? { owner: owners } : {}),
      ...(split ? { split: true } : {}),
    },
    // The owner parameter repeats (`owner=Dana&owner=Avi`); axios would otherwise send
    // `owner[]=`, which the API does not read.
    paramsSerializer: { indexes: null },
    responseType: 'arraybuffer',
    // One file per owner is several reports generated in one request.
    timeout: split ? 60000 : 30000,
  });

  const base64 = arrayBufferToBase64(response.data);
  const uri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const Sharing = await import('expo-sharing');
  await Sharing.shareAsync(uri, { mimeType, dialogTitle: filename });
}

export async function downloadIncomeExpenseReport(
  year: number,
  format: ReportFormat,
  basis: RevenueBasis = 'accrual',
  options: OwnerExportOptions = {},
): Promise<void> {
  await downloadAndShare(
    '/reports/income-expense',
    year,
    format,
    `income-expense-${year}`,
    options,
    basis,
  );
}

/**
 * No basis parameter: an expense log has no revenue to recognise, and expenses already
 * count on the date they were paid under both bases.
 */
export async function downloadExpenseLogReport(
  year: number,
  format: ReportFormat,
  options: OwnerExportOptions = {},
): Promise<void> {
  await downloadAndShare(
    '/reports/expense-log',
    year,
    format,
    `expense-log-${year}`,
    options,
  );
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
