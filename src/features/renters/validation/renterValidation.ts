import { z } from "zod";

const nonEmptyTrimmed = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: "common.required" });

const numericString = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: "common.required" })
  .refine((val) => !Number.isNaN(Number(val)), { message: "mustBeNumber" });

const optionalNumericString = z
  .string()
  .transform((val) => val.trim())
  .refine(
    (val) => val === "" || !Number.isNaN(Number(val)),
    { message: "mustBeNumber" },
  );

const dateString = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: "common.required" })
  .refine(
    (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: "dateFormatInvalid" },
  );

const optionalString = z.string().transform((val) => val.trim());

const leaseYearSchema = z.object({
  amount: optionalNumericString,
  type: z.enum(["option", "contract"]).optional(),
});

const extraContactSchema = z.object({
  name: z.string().transform((v) => v.trim()),
  phone: z.string().transform((v) => v.trim()),
});

export const renterFormSchema = z.object({
  firstName: nonEmptyTrimmed,
  lastName: nonEmptyTrimmed,
  phone: nonEmptyTrimmed,
  email: optionalString,
  leaseStart: z.string().transform((val) => val.trim()).refine(
    (val) => val === "" || /^\d{4}-\d{2}-\d{2}$/.test(val),
    { message: "dateFormatInvalid" },
  ),
  propertyId: z.number().nullable(),
  paymentType: optionalString,
  paymentDate: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  paymentFrequency: z
    .enum(["monthly", "quarterly", "yearly"])
    .optional(),
  insuranceType: optionalString,
  insuranceAmount: optionalNumericString,
  contractTermYears: optionalNumericString,
  optionYears: optionalNumericString,
  baseRent: optionalNumericString,
  escalationMode: z.enum(["none", "percent", "fixed", "custom", "cpi"]).optional(),
  escalationValue: optionalNumericString,
  leaseYears: z.array(leaseYearSchema).optional(),
  contactId: z.string().nullable().optional(),
  extraContacts: z.array(extraContactSchema).optional(),
  fullContractUrl: z.string().nullable().optional(),
  idImageUrl: z.string().nullable().optional(),
});

export type RenterFormValues = z.infer<typeof renterFormSchema>;
