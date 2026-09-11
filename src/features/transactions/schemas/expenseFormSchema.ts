import { z } from 'zod';

export const expenseFormSchema = z.object({
  propertyIds: z.array(z.number()).min(1, 'validation.propertyRequired'),
  renterId: z.number().nullable(),
  amount: z
    .string()
    .min(1, 'validation.amountRequired')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
      message: 'validation.amountRequired',
    }),
  dateOfPayment: z.string().min(1, 'validation.dateRequired'),
  paymentMethod: z.string().min(1, 'validation.paymentMethodRequired'),
  categoryIds: z.array(z.number()).min(1, 'common.required'),
  supplierId: z.number().nullable(),
  notes: z.string(),
  receiptImageUrl: z.string().nullable().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
