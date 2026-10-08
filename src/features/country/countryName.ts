import type { TFunction } from 'i18next';

/**
 * A country's name in the reader's language.
 *
 * The backend serves English names only, and Hermes has no `Intl.DisplayNames` to translate
 * them, so the Hebrew names live in he.json under `country.names` (generated from CLDR).
 * English has no such block: it falls through to the backend's own name.
 */
export function countryDisplayName(
  t: TFunction,
  country: { countryCode: string; name: string },
): string {
  return t(`country.names.${country.countryCode}`, { defaultValue: country.name });
}
