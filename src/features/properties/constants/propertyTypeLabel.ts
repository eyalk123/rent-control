import type { PropertyType } from '@/src/shared/types';

/**
 * The i18n key for a property type's label: `garden_apartment` → `property.typeGardenApartment`.
 *
 * One function so every screen builds it the same way. Capitalising only the first letter
 * gave `property.typeGarden_apartment` for the multi-word types, which has no entry and
 * rendered as the raw key.
 */
export function propertyTypeLabelKey(type: PropertyType): string {
  return `property.type${type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`;
}
