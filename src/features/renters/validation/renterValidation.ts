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

// How one lease year's rent derives from the previous year's — only used in "custom" mode.
// `percent` and `fixed` are the only rules that need a number to go with them; the rest
// ("manual" = the owner typed the amount, "none" = same as last year, "cpi" = the server
// prices it from the index) carry no value.
const leaseYearRuleSchema = z
  .object({
    mode: z.enum(["manual", "none", "percent", "fixed", "cpi"]),
    value: optionalNumericString,
  })
  .superRefine((rule, ctx) => {
    if ((rule.mode === "percent" || rule.mode === "fixed") && rule.value === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "renter.ruleValueRequired",
      });
    }
  });

const leaseYearSchema = z.object({
  amount: optionalNumericString,
  type: z.enum(["option", "contract"]).optional(),
  rule: leaseYearRuleSchema.optional(),
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
    { message: "validation.dateFormatInvalid" },
  ),
  propertyId: z.number().nullable(),
  paymentType: optionalString,
  // Date-shaped ("2000-01-DD"); only the day component is submitted, as payment_day_of_month.
  // Mirrors the backend's RenterCreate.payment_day_in_range (1..31) so a bad value — typed, or
  // prefilled by a lease scan — is caught here instead of only as a 422 at submit.
  paymentDate: z
    .string()
    .transform((val) => val.trim())
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const match = /^\d{4}-\d{2}-(\d{2})$/.exec(val);
        if (!match) return false;
        const day = Number(match[1]);
        return day >= 1 && day <= 31;
      },
      { message: "validation.paymentDayInvalid" },
    ),
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
