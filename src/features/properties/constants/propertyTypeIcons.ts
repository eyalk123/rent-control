import type { IconName } from '@/src/shared/components/ui';
import type { PropertyType } from '@/src/shared/types';

/**
 * The glyph that stands for each property type.
 *
 * One map, shared. It previously existed twice - in `PropertyInfoTab` and
 * `RenterPropertyTab` - and both copies were typed `Record<PropertyType, IconName>` while
 * covering only three of the five types, so both were type errors and both fell through to
 * an `?? 'home'` fallback for the rest.
 *
 * `Icon`'s names are a closed union on purpose, so the two newer types reuse existing
 * glyphs rather than widening it: a garden apartment reads as house-like, and a housing
 * unit sits with the other multi-dwelling types.
 */
export const PROPERTY_TYPE_ICONS: Record<PropertyType, IconName> = {
  apartment: 'building',
  house: 'home',
  commercial: 'store',
  garden_apartment: 'home',
  housing_unit: 'building',
};

export function getPropertyTypeIcon(type: PropertyType): IconName {
  return PROPERTY_TYPE_ICONS[type] ?? 'home';
}
