import { z } from 'zod';

export const revenueFormSchema = z.object({
  propertyId: z
    .number({ invalid_type_error: 'validation.propertyRequired' })
    .nullable()
    .refine((v) => v !== null, { message: 'validation.propertyRequired' }),
  renterId: z.number().nullable(),
  amount: z
    .string()
    .min(1, 'validation.amountRequired')
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, {
      message: 'validation.amountRequired',
    }),
  monthFor: z.string().min(1, 'validation.monthForRequired'),
  dateOfPayment: z.string().min(1, 'validation.dateRequired'),
  paymentMethod: z.string(),
  notes: z.string(),
});
