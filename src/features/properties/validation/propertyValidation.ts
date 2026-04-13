import { z } from 'zod';
import type { PropertyType } from '@/src/shared/types';

export const PROPERTY_TYPES: PropertyType[] = ['apartment', 'house', 'commercial'];

const nonEmptyTrimmed = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: 'required' });

const numericString = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: 'required' })
  .refine((val) => !Number.isNaN(Number(val)), { message: 'mustBeNumber' })
  ;

const optionalNumericString = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val === '' || !Number.isNaN(Number(val)), { message: 'mustBeNumber' });

export const propertyFormSchema = z.object({
  address: nonEmptyTrimmed,
  city: nonEmptyTrimmed,
  zipCode: z.string().transform((val) => val.trim()),
  type: z.custom<PropertyType | undefined>((val) => val === undefined || val === '' || (typeof val === 'string' && PROPERTY_TYPES.includes(val as PropertyType)), {
    message: 'invalidType',
  }).optional(),
  sqFt: optionalNumericString,
  numberOfRooms: optionalNumericString,
  parkingNumbersStr: z.string().transform((val) => val ?? ''),
  propertyOwner: z.string().transform((val) => val.trim()),
  electricityMeterNumber: z.string().transform((val) => val.trim()),
  waterMeterTax: optionalNumericString,
  propertyTax: optionalNumericString,
  houseCommittee: optionalNumericString,
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;
