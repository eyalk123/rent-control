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

/**
 * The account's calling code, published when the country config resolves — the same module
 * state pattern as `money.ts`, and for the same reason: the conversion happens deep inside
 * render paths and inside `ContactActionsRow`, which is also used for **suppliers** and so
 * has no property to thread a country down from.
 *
 * Defaults to Israel, which is what this file hardcoded before countries existed, so the
 * pre-config first paint behaves exactly as it always did.
 */
let activeDialCode = '972';

/** True only for Israel — see the note on the 9-digit rule in `toWhatsAppNumber`. */
let activeIsIsrael = true;

export function setActiveDialCode(dialCode: string, countryCode: string): void {
  activeDialCode = dialCode;
  activeIsIsrael = countryCode === 'IL';
}

/**
 * Best-effort conversion of a stored phone number to the bare international digits
 * wa.me expects: country code first, no `+`, no leading zero, no punctuation.
 *
 * Renter phones are free text (the form only trims them, and the contact picker imports
 * whatever the address book holds), so this has to cope with `050-123-4567`,
 * `+972 50-123-4567`, `(555) 123-4567` and friends. It is a heuristic, not a parser, and
 * the button is deliberately shown even when it guesses wrong: WhatsApp's own
 * "phone number is invalid" screen is a better outcome than silently offering nothing.
 *
 * `dialCode` overrides the account default for a number that belongs to a specific
 * property — rules attach to where the building is. Most callers omit it.
 */
export function toWhatsAppNumber(
  phone: string | null | undefined,
  dialCode?: string | null,
): string {
  const raw = (phone ?? '').trim();
  if (!raw) return '';

  const code = (dialCode ?? activeDialCode).replace(/\D/g, '');

  // An explicit + (or 00) means the country code is already there — take it as given, and
  // ignore the account's country entirely. This is what lets an Israeli landlord with one
  // American tenant simply type `+1…` and have it work.
  if (raw.startsWith('+')) return raw.slice(1).replace(/\D/g, '');
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);

  // Without a country to default to there is nothing to add, and guessing would be worse
  // than leaving it alone.
  if (!code) return digits;

  // National trunk prefix: a leading 0 is dropped and replaced by the country code. True
  // across most of the world — Israel, the UK, Germany, France, Australia. The NANP has no
  // trunk prefix, so this branch simply never fires for a US or Canadian number.
  if (digits.startsWith('0')) return `${code}${digits.slice(1)}`;

  // An Israeli mobile whose leading zero was already lost: 9 digits starting 5. Kept for
  // Israel only — it is a shape, not a rule, and applying it elsewhere would mangle any
  // 9-digit national number that happens to start with a 5.
  if (activeIsIsrael && digits.length === 9 && digits.startsWith('5')) {
    return `${code}${digits}`;
  }

  // A bare national number with no trunk zero — `(555) 123-4567` in the US, and the single
  // most common way a number is stored outside Israel. This branch is the reason the button
  // used to be broken for most non-Israeli users: it previously returned the digits
  // untouched, producing a wa.me link with no country code at all.
  //
  // Guarded by "does it already start with the country code", so a number that carries its
  // own prefix without a + is not double-stamped. That check is safe in both directions for
  // the cases that matter: a NANP national number can never begin with 1 (area codes start
  // 2-9), and an Israeli national number can never begin with 972.
  if (!digits.startsWith(code)) return `${code}${digits}`;

  return digits;
}

/** The chat URL. Omitting `message` opens the conversation with an empty input box. */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
  dialCode?: string | null,
): string {
  const number = toWhatsAppNumber(phone, dialCode);
  const base = `https://wa.me/${number}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Open the chat. No-op when there is no number to open it with. */
export function openWhatsApp(
  phone: string | null | undefined,
  message?: string,
  dialCode?: string | null,
): void {
  if (!toWhatsAppNumber(phone, dialCode)) return;
  Linking.openURL(buildWhatsAppUrl(phone, message, dialCode));
}
