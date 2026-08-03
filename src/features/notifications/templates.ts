/**
 * The WhatsApp message templates behind the alert rows.
 *
 * Defaults live in the translation files so they go through the normal i18n pipeline;
 * the backend stores only the owner's *overrides*, keyed by template and locale. A
 * missing entry therefore means "use the default", which is what makes both the reset
 * button and per-language independence work with no extra state: editing the English
 * copy leaves the Hebrew default untouched, and clearing an override restores the
 * shipped wording.
 *
 * Placeholders are single-brace `{token}`, matching the backend's push copy in
 * `app/services/notification_messages.py`, so the same figure reads identically in a
 * push and in a WhatsApp message.
 */
import { formatMoney } from '@/src/shared/utils/money';
import { formatDateFull } from '@/src/shared/utils/dates';
import type { CpiChangeStage } from './types';

/**
 * Deliberately not the three `NotificationEvent` values: a CPI change reads completely
 * differently in its two stages — an estimate that says so, and a settled amount — so
 * each stage gets its own template. Mirrors WHATSAPP_TEMPLATE_KEYS on the backend.
 */
export const WHATSAPP_TEMPLATE_KEYS = [
  'overdue',
  'lease_expiring',
  'cpi_upcoming',
  'cpi_changed',
] as const;

export type WhatsAppTemplateKey = (typeof WHATSAPP_TEMPLATE_KEYS)[number];

/** Overrides as stored: `{ overdue: { en: '...', he: '...' } }`. */
export type WhatsAppTemplates = Partial<Record<WhatsAppTemplateKey, Record<string, string>>>;

/** Which placeholders the editor offers for each template, in insert-button order. */
export const TEMPLATE_TOKENS: Record<WhatsAppTemplateKey, string[]> = {
  overdue: ['name', 'full_name', 'address', 'amount', 'days'],
  lease_expiring: ['name', 'full_name', 'address', 'date', 'days'],
  cpi_upcoming: ['name', 'full_name', 'address', 'old_amount', 'new_amount', 'change', 'date'],
  cpi_changed: ['name', 'full_name', 'address', 'old_amount', 'new_amount', 'change', 'date'],
};

export type TokenValues = Record<string, string>;

/** The alert data a message is built from, independent of how a row is rendered. */
export type AlertMessageSource = {
  first_name: string;
  last_name: string;
  property_address: string | null;
} & (
  | { kind: 'overdue'; amount: number; days: number }
  | { kind: 'lease_expiring'; leaseEndIso: string; days: number }
  | {
      kind: 'cpi';
      stage: CpiChangeStage;
      oldAmount: number;
      newAmount: number;
      effectiveIso: string;
    }
);

export function templateKeyFor(source: AlertMessageSource): WhatsAppTemplateKey {
  if (source.kind === 'overdue') return 'overdue';
  if (source.kind === 'lease_expiring') return 'lease_expiring';
  return source.stage === 'upcoming' ? 'cpi_upcoming' : 'cpi_changed';
}

function isoToDate(iso: string): Date | null {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatIsoDate(iso: string, language: string): string {
  const date = isoToDate(iso);
  return date ? formatDateFull(date, language) : iso;
}

/** A signed money delta with its percentage, e.g. `+240₪, +4.8%`. */
function formatChange(oldAmount: number, newAmount: number): string {
  const delta = newAmount - oldAmount;
  const sign = delta < 0 ? '-' : '+';
  const money = `${sign}${formatMoney(Math.abs(Math.round(delta)))}`;
  if (!oldAmount) return money;
  const percent = Math.abs((delta / oldAmount) * 100).toFixed(1);
  return `${money}, ${sign}${percent}%`;
}

export function buildTokenValues(source: AlertMessageSource, language: string): TokenValues {
  const base: TokenValues = {
    name: source.first_name,
    full_name: `${source.first_name} ${source.last_name}`.trim(),
    address: source.property_address ?? '',
  };

  if (source.kind === 'overdue') {
    return { ...base, amount: formatMoney(source.amount), days: String(source.days) };
  }
  if (source.kind === 'lease_expiring') {
    return {
      ...base,
      date: formatIsoDate(source.leaseEndIso, language),
      days: String(source.days),
    };
  }
  return {
    ...base,
    old_amount: formatMoney(source.oldAmount),
    new_amount: formatMoney(source.newAmount),
    change: formatChange(source.oldAmount, source.newAmount),
    date: formatIsoDate(source.effectiveIso, language),
  };
}

/**
 * Substitute `{token}` placeholders. An unrecognised token is left in the text exactly
 * as typed rather than blanked — a user who fat-fingers `{amont}` should see their typo
 * in the message and fix it, not silently send a sentence with a hole in it.
 */
export function renderTemplate(template: string, values: TokenValues): string {
  return template.replace(/\{(\w+)\}/g, (match, token: string) =>
    Object.prototype.hasOwnProperty.call(values, token) ? values[token] : match,
  );
}

type Translate = (key: string) => string;

export function getDefaultTemplate(key: WhatsAppTemplateKey, t: Translate): string {
  return t(`whatsappTemplates.defaults.${key}`);
}

/** The owner's override for this template + language, or the shipped default. */
export function resolveTemplate(
  key: WhatsAppTemplateKey,
  language: string,
  overrides: WhatsAppTemplates | undefined,
  t: Translate,
): string {
  const locale = language.startsWith('he') ? 'he' : 'en';
  const override = overrides?.[key]?.[locale];
  return override?.trim() ? override : getDefaultTemplate(key, t);
}

/** The finished message for an alert, ready to hand to `openWhatsApp`. */
export function buildAlertMessage(
  source: AlertMessageSource,
  language: string,
  overrides: WhatsAppTemplates | undefined,
  t: Translate,
): string {
  const key = templateKeyFor(source);
  return renderTemplate(
    resolveTemplate(key, language, overrides, t),
    buildTokenValues(source, language),
  );
}

/**
 * Stand-in data for the editor's live preview. Fixed rather than drawn from the user's
 * real portfolio so the preview is stable while typing and never leaks a tenant's name
 * into a screenshot of the settings screen.
 */
export function sampleValues(key: WhatsAppTemplateKey, language: string): TokenValues {
  const he = language.startsWith('he');
  const source: AlertMessageSource = (() => {
    const who = {
      first_name: he ? 'דני' : 'Dani',
      last_name: he ? 'כהן' : 'Cohen',
      property_address: he ? 'הרצל 12, תל אביב' : '12 Herzl St, Tel Aviv',
    };
    if (key === 'overdue') return { ...who, kind: 'overdue' as const, amount: 5000, days: 3 };
    if (key === 'lease_expiring') {
      return { ...who, kind: 'lease_expiring' as const, leaseEndIso: '2026-12-31', days: 30 };
    }
    return {
      ...who,
      kind: 'cpi' as const,
      stage: (key === 'cpi_upcoming' ? 'upcoming' : 'changed') as CpiChangeStage,
      oldAmount: 5000,
      newAmount: 5240,
      effectiveIso: '2026-03-01',
    };
  })();
  return buildTokenValues(source, language);
}
