import React from 'react';
import type { TFunction } from 'i18next';
import { DotMark, InitialsMark, type FilterOption } from '@/src/shared/components/ui';
import { PropertyThumb } from '@/src/features/properties/components/PropertyThumb';
import { propertyTypeLabelKey } from '@/src/features/properties/constants/propertyTypeLabel';
import { propertyCountLabel } from '@/src/features/property-owners/api/propertyOwners';
import { formatPropertyAddress } from '@/src/shared/utils/propertyAddress';
import type { Property, PropertyBrief, Renter } from '@/src/shared/types';

/**
 * Filter-sheet rows, built the same way on every list that filters by these things: each
 * row carries the item's own mark in its color, as the lists themselves show it.
 */

/** A property: its picture on its color, the city and type underneath. Floor/apartment are
 *  in the label: two flats in one building share an address. */
export function propertyFilterOption(property: Property | PropertyBrief, t: TFunction): FilterOption {
  return {
    id: property.id,
    label: formatPropertyAddress(property, t),
    sublabel: `${property.city} · ${t(propertyTypeLabelKey(property.type))}`,
    leading: <PropertyThumb property={property} width={48} height={36} radius={8} iconSize={18} />,
  };
}

/** A renter: initials in their color, the property they live at underneath. */
export function renterFilterOption(renter: Renter, t: TFunction): FilterOption {
  const name = `${renter.first_name} ${renter.last_name}`;
  return {
    id: renter.id,
    label: name,
    sublabel: renter.property ? formatPropertyAddress(renter.property, t) : undefined,
    leading: <InitialsMark name={name} color={renter.color} />,
  };
}

/** A property owner: navy initials, as on the owners list, and how many properties. */
export function ownerFilterOption(
  id: string | number,
  name: string,
  propertyCount: number,
  t: TFunction,
): FilterOption {
  return {
    id,
    label: name,
    sublabel: propertyCount > 0 ? propertyCountLabel(t, propertyCount) : undefined,
    leading: <InitialsMark name={name} neutral />,
  };
}

/** An expense category: its color as a dot. */
export function categoryFilterOption(id: number, label: string, color: string | null | undefined): FilterOption {
  return { id, label, leading: <DotMark color={color} /> };
}

/** A supplier: initials in its first category's color, as on the suppliers list. */
export function supplierFilterOption(id: number, name: string, color: string | null | undefined): FilterOption {
  return { id, label: name, leading: <InitialsMark name={name} color={color} /> };
}
