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

export const renterFormSchema = z.object({
  firstName: nonEmptyTrimmed,
  lastName: nonEmptyTrimmed,
  phone: nonEmptyTrimmed,
  email: nonEmptyTrimmed,
  monthlyRent: numericString,
  leaseStart: dateString,
  leaseEnd: z
    .string()
    .transform((val) => val.trim())
    .optional(),
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
});

export type RenterFormValues = z.infer<typeof renterFormSchema>;
