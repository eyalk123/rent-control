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
    (v) => v.bank === '' && v.branch === '' && v.account === '' || isValidBankAccount(v),
    { message: 'Invalid bank account' },
  );

export const supplierFormSchema = z.object({
  name: nonEmptyTrimmed,
  phone: optionalString,
  email: optionalString,
  notes: optionalString,
  categoryIds: z
    .array(z.number())
    .min(1, { message: 'At least one category is required' }),
  bankAccount: bankAccountSchema,
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;
