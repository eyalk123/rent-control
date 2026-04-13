import type { TimePeriodType } from '@/src/features/transactions/screens/types';

export function getDefaultPeriodValue(type: Exclude<TimePeriodType, 'custom'>): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (type === '1month') {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  }
  if (type === 'quarter') {
    const currentQ = Math.ceil(month / 3);
    const prevQ = currentQ === 1 ? 4 : currentQ - 1;
    const prevQYear = currentQ === 1 ? year - 1 : year;
    return `${prevQYear}-Q${prevQ}`;
  }
  return String(year - 1);
}

/** Returns an array of 'YYYY-MM-01' strings for the given period. */
export function getMonthsForPeriod(
  type: Exclude<TimePeriodType, 'custom'>,
  value: string,
): string[] {
  if (type === '1month') {
    const [y, m] = value.split('-');
    return [`${y}-${m}-01`];
  }
  if (type === 'quarter') {
    const [yearStr, qPart] = value.split('-');
    const qYear = Number(yearStr);
    const qNum = Number(qPart.replace('Q', ''));
    const startMonth = (qNum - 1) * 3 + 1;
    return [0, 1, 2].map((i) => {
      const m = startMonth + i;
      return `${qYear}-${String(m).padStart(2, '0')}-01`;
    });
  }
  const y = Number(value);
  return Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}-01`);
}

export function generatePeriodOptions(
  type: Exclude<TimePeriodType, 'custom'>,
  locale: string,
): { label: string; value: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (type === '1month') {
    const items: { label: string; value: string }[] = [];
    for (let i = 2; i >= -11; i--) {
      let m = month + i;
      let y = year;
      while (m <= 0) { m += 12; y--; }
      while (m > 12) { m -= 12; y++; }
      const value = `${y}-${String(m).padStart(2, '0')}`;
      const label = new Date(y, m - 1, 1).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });
      items.push({ label, value });
    }
    return items;
  }

  if (type === 'quarter') {
    const items: { label: string; value: string }[] = [];
    let curQ = Math.ceil(month / 3);
    let curY = year;
    for (let i = 0; i < 8; i++) {
      items.push({ label: `Q${curQ} ${curY}`, value: `${curY}-Q${curQ}` });
      curQ--;
      if (curQ === 0) { curQ = 4; curY--; }
    }
    return items;
  }

  return [year, year - 1, year - 2, year - 3].map((y) => ({
    label: String(y),
    value: String(y),
  }));
}

export function formatDateDisplay(value: string, locale: string): string {
  const parts = value.split('-').map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return value;
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
