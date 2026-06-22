import { z } from 'zod';
import type { PropertyType } from '@/src/shared/types';

export const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'commercial', 'garden_apartment', 'housing_unit'];

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
