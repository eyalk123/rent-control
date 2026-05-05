/**
 * Month-bucketing utilities for the Transactions list view.
 * Uses `date_of_payment` as the canonical date for both revenues and expenses.
 */
import type { Transaction } from '@/src/shared/types';

export type MonthKey = string; // 'YYYY-MM'

export function currentMonthKey(): MonthKey {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export interface MonthBucket {
  key: MonthKey;
  year: number;
  month: number; // 1-12
  revenue: number;
  expenses: number;
  profit: number;
  transactions: Transaction[];
}

const toNumber = (n: unknown): number => {
  if (n == null) return 0;
  const num = Number(n);
  return isNaN(num) ? 0 : num;
};

function monthKeyFromDate(dateStr: string): MonthKey | null {
  if (!dateStr || dateStr.length < 7) return null;
  return dateStr.slice(0, 7);
}

function emptyBucket(key: MonthKey): MonthBucket {
  const [year, month] = key.split('-').map(Number);
  return {
    key,
    year,
    month,
    revenue: 0,
    expenses: 0,
    profit: 0,
    transactions: [],
  };
}

/** Group transactions by month, sorted descending (newest first). */
export function bucketByMonth(transactions: Transaction[]): MonthBucket[] {
  const map = new Map<MonthKey, MonthBucket>();
  for (const tx of transactions) {
    const key = monthKeyFromDate(tx.date_of_payment);
    if (!key) continue;
    let bucket = map.get(key);
    if (!bucket) {
      bucket = emptyBucket(key);
      map.set(key, bucket);
    }
    const amount = toNumber(tx.amount);
    if (tx.type === 'revenue') bucket.revenue += amount;
    else bucket.expenses += amount;
    bucket.profit = bucket.revenue - bucket.expenses;
    bucket.transactions.push(tx);
  }
  return Array.from(map.values()).sort((a, b) =>
    a.key < b.key ? 1 : a.key > b.key ? -1 : 0,
  );
}

/**
 * Return exactly N consecutive months ending at `refDate` (default: now),
 * padding missing months with empty buckets so the chart always has N columns.
 * Result is sorted oldest → newest (chart reads left → right).
 */
export function lastNMonths(
  buckets: MonthBucket[],
  n: number,
  refDate: Date = new Date(),
): MonthBucket[] {
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  const result: MonthBucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push(byKey.get(key) ?? emptyBucket(key));
  }
  return result;
}

// Static lookup tables — avoids the slow Intl/toLocaleDateString API in React Native.
const MONTHS_SHORT: Record<string, string[]> = {
  'en-US': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  'he-IL': ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'],
};
const MONTHS_LONG: Record<string, string[]> = {
  'en-US': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  'he-IL': ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
};

function shortMonth(locale: string, monthIndex: number): string {
  return (MONTHS_SHORT[locale] ?? MONTHS_SHORT['en-US'])[monthIndex];
}
function longMonth(locale: string, monthIndex: number): string {
  return (MONTHS_LONG[locale] ?? MONTHS_LONG['en-US'])[monthIndex];
}

/** "Apr" / "אפר׳" */
export function monthLabel(key: MonthKey, locale: string): string {
  const month = parseInt(key.slice(5, 7), 10);
  return shortMonth(locale, month - 1);
}

/** "APR 2026" */
export function monthYearLabel(key: MonthKey, locale: string): string {
  const year = key.slice(0, 4);
  const month = parseInt(key.slice(5, 7), 10);
  return `${shortMonth(locale, month - 1).toUpperCase()} ${year}`;
}

/** "APRIL · PROFIT" */
export function heroEyebrow(
  key: MonthKey,
  locale: string,
  profit: number,
  profitLabel: string,
  lossLabel: string,
): string {
  const month = parseInt(key.slice(5, 7), 10);
  const word = profit < 0 ? lossLabel : profitLabel;
  return `${longMonth(locale, month - 1).toUpperCase()} · ${word.toUpperCase()}`;
}

/** "15 Apr" — fast manual format for transaction row dates. */
export function formatTransactionDate(dateStr: string, locale: string): string {
  if (!dateStr || dateStr.length < 10) return dateStr;
  const day = dateStr.slice(8, 10);
  const month = parseInt(dateStr.slice(5, 7), 10);
  return `${day} ${shortMonth(locale, month - 1)}`;
}
