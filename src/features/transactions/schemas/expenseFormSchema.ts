import { z } from 'zod';

export const expenseFormSchema = z.object({
  propertyIds: z.array(z.number()).min(1),
  renterId: z.number().nullable(),
  amount: z
    .string()
    .min(1)
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0),
  dateOfPayment: z.string().min(1),
  paymentMethod: z.string().min(1),
  categoryIds: z.array(z.number()).min(1, 'common.required'),
  supplierId: z.number().nullable(),
  notes: z.string(),
  receiptImageUrl: z.string().nullable().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
