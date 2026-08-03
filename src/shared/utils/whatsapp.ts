import { Linking } from 'react-native';

/**
 * WhatsApp "Click to Chat" links.
 *
 * `https://wa.me/<digits>?text=<encoded>` opens the conversation with the message
 * **typed into the input box but not sent** — the user still has to press send. That is
 * the whole point: the app never speaks to a tenant on the owner's behalf.
 *
 * The `https://wa.me` form is used rather than the `whatsapp://` scheme because it needs
 * no `LSApplicationQueriesSchemes` entry on iOS and no `<queries>` entry on Android 11+,
 * and it degrades to a "get WhatsApp" page instead of failing when the app is missing.
 */

/** Numbers with no country code are assumed Israeli — the app is ILS-only. */
const DEFAULT_COUNTRY_CODE = '972';

/**
 * Best-effort conversion of a stored phone number to the bare international digits
 * wa.me expects: country code first, no `+`, no leading zero, no punctuation.
 *
 * Renter phones are free text (the form only trims them, and the contact picker imports
 * whatever the address book holds), so this has to cope with `050-123-4567`,
 * `+972 50-123-4567`, `(050) 1234567` and friends. It is a heuristic, not a parser: a
 * foreign number typed without a `+` will be misread as Israeli. When it guesses wrong
 * WhatsApp shows its own "phone number is invalid" screen, which is the accepted
 * trade-off for not hiding the button.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string {
  const raw = (phone ?? '').trim();
  if (!raw) return '';

  // A leading + (or 00) means the country code is already there — take it as given.
  if (raw.startsWith('+')) return raw.slice(1).replace(/\D/g, '');
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);

  // Local Israeli form: 05X-XXXXXXX -> 9725XXXXXXXX.
  if (digits.startsWith('0')) return `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  // A bare mobile number with its leading zero already lost (9 digits, starts with 5).
  if (digits.length === 9 && digits.startsWith('5')) return `${DEFAULT_COUNTRY_CODE}${digits}`;

  // Anything else already carries a country code, or is beyond guessing.
  return digits;
}

/** The chat URL. Omitting `message` opens the conversation with an empty input box. */
export function buildWhatsAppUrl(phone: string | null | undefined, message?: string): string {
  const number = toWhatsAppNumber(phone);
  const base = `https://wa.me/${number}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Open the chat. No-op when there is no number to open it with. */
export function openWhatsApp(phone: string | null | undefined, message?: string): void {
  if (!toWhatsAppNumber(phone)) return;
  Linking.openURL(buildWhatsAppUrl(phone, message));
}
