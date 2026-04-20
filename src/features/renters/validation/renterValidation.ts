import { z } from "zod";

const nonEmptyTrimmed = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: "required" });

const numericString = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: "required" })
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
  .refine((val) => val.length > 0, { message: "required" })
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
  leaseStart: dateString,
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
  contractYears: optionalNumericString,
  leaseYears: z.array(leaseYearSchema).optional(),
  contactId: z.string().nullable().optional(),
  extraContacts: z.array(extraContactSchema).optional(),
});

export type RenterFormValues = z.infer<typeof renterFormSchema>;
