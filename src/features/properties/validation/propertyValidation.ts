import { z } from 'zod';
import { allowedModes } from '@/src/shared/utils/capabilities';
import type { PropertyType } from '@/src/shared/types';

export const PROPERTY_TYPES: PropertyType[] = [
  'apartment',
  'house',
  'commercial',
  'garden_apartment',
  'housing_unit',
  'condo_townhouse',
  'room',
  'other',
];

/**
 * Garden Apartment and Housing Unit are Israeli categories — they mean nothing to a
 * landlord elsewhere, and the skimmed set replaces them with Condo / Townhouse, Room and
 * Other.
 *
 * The array above keeps all eight. An existing property can hold any of them and must keep
 * rendering, and the enum values cannot be dropped from the database anyway. Only the
 * picker and the filter narrow — and because both now derive from this one list, the
 * Housing Unit filter bug (it was missing from the Properties table's Type dropdown)
 * disappears for Israel as a side effect.
 */
export const PROPERTY_TYPE_REQUIREMENTS: Partial<Record<PropertyType, 'israeliPropertyTypes'>> = {
  garden_apartment: 'israeliPropertyTypes',
  housing_unit: 'israeliPropertyTypes',
};

/** The types this country may actually pick. */
export const availablePropertyTypes = (): PropertyType[] =>
  allowedModes(PROPERTY_TYPES, PROPERTY_TYPE_REQUIREMENTS);

const nonEmptyTrimmed = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: 'common.required' });

const numericString = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: 'common.required' })
  .refine((val) => !Number.isNaN(Number(val)), { message: 'mustBeNumber' })
  ;

const optionalNumericString = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val === '' || !Number.isNaN(Number(val)), { message: 'mustBeNumber' });

export const propertyFormSchema = z.object({
  address: nonEmptyTrimmed,
  city: nonEmptyTrimmed,
  block: optionalNumericString,
  plot: optionalNumericString,
  zipCode: z.string().transform((val) => val.trim()),
  type: z.custom<PropertyType>((val) => typeof val === 'string' && PROPERTY_TYPES.includes(val as PropertyType), {
    message: 'common.required',
  }),
  sqFt: optionalNumericString,
  numberOfRooms: optionalNumericString,
  parkingNumbersStr: z.string().transform((val) => val ?? ''),
  propertyOwner: z.string().transform((val) => val.trim()),
  inventoryNotes: z.string().transform((val) => val ?? ''),
  electricityMeterNumber: z.string().transform((val) => val.trim()),
  electricityAccountNumber: z.string().transform((val) => val.trim()),
  waterMeterNumber: z.string().transform((val) => val.trim()),
  waterAccountNumber: z.string().transform((val) => val.trim()),
  propertyTax: optionalNumericString,
  houseCommittee: optionalNumericString,
  basicContractUrl: z.string().nullable().optional(),
  landRegistryUrl: z.string().nullable().optional(),
  floor: optionalNumericString,
  apartment: z.string().transform((val) => val.trim()),
  pendingFiles: z
    .array(
      z.object({
        localUri: z.string(),
        name: z.string(),
        label: z.string(),
        mimeType: z.string().optional(),
      })
    )
    .max(10)
    .optional(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
