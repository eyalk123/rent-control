import { z } from 'zod';
import type { PropertyType } from '@/src/types';

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
  zipCode: nonEmptyTrimmed,
  type: z.custom<PropertyType>((val) => typeof val === 'string' && PROPERTY_TYPES.includes(val as PropertyType), {
    message: 'invalidType',
  }),
  sqFt: numericString,
  purchasePrice: numericString,
  numberOfRooms: optionalNumericString,
  parkingNumbersStr: z.string().transform((val) => val ?? ''),
  electricityMeterNumber: z.string().transform((val) => val.trim()),
  waterMeterTax: optionalNumericString,
  propertyTax: optionalNumericString,
  houseCommittee: optionalNumericString,
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

