import type { Property } from '@/src/shared/types';

type TFn = (key: string) => string;

/** Builds the ", <floor label> N, <apartment label> X" suffix from whichever of
 *  floor/apartment are present. Returns an empty string when neither exists.
 *  Reuses existing i18n keys. Kept separate from the address so callers can
 *  render it with a lighter weight/color than the address itself. */
export function formatFloorApartment(
  property: Pick<Property, 'floor' | 'apartment'>,
  t: TFn,
  leadingSeparator: boolean = true,
): string {
  const parts: string[] = [];
  if (property.floor != null && String(property.floor).trim() !== '') {
    parts.push(`${t('property.floor')} ${property.floor}`);
  }
  if (property.apartment != null && String(property.apartment).trim() !== '') {
    parts.push(`${t('property.apartment')} ${property.apartment}`);
  }
  if (!parts.length) return '';
  return leadingSeparator ? `, ${parts.join(', ')}` : parts.join(', ');
}

/** Builds the full "address, <floor label> N, <apartment label> X" string. */
export function formatPropertyAddress(
  property: Pick<Property, 'address' | 'floor' | 'apartment'>,
  t: TFn,
): string {
  return `${property.address}${formatFloorApartment(property, t)}`;
}
