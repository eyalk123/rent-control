import { z } from 'zod';
import { isValidBankAccount } from '@/src/shared/components/form/BankAccountInput';

const nonEmptyTrimmed = z
  .string()
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, { message: 'common.required' });

const optionalString = z.string().transform((val) => (val ?? '').trim()).default('');

const bankAccountSchema = z
  .object({ bank: z.string(), branch: z.string(), account: z.string() })
  .refine(
    (v) => (v.bank === '' && v.branch === '' && v.account === '') || isValidBankAccount(v),
    { message: 'suppliers.invalidBankAccount' },
  );

// The supplier form's shape, less the categories. `bankAccount` is the Israeli structured
// form and `paymentDetails` the free-text one used elsewhere; one of them is always empty.
export const propertyOwnerFormSchema = z.object({
  name: nonEmptyTrimmed,
  phone: optionalString,
  email: optionalString,
  notes: optionalString,
  bankAccount: bankAccountSchema,
  paymentDetails: optionalString,
});

export type PropertyOwnerFormValues = z.infer<typeof propertyOwnerFormSchema>;
