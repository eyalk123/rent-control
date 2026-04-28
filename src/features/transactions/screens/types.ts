import type { PaymentMethod } from '@/src/shared/types';

export type TransactionMode = 'choose' | 'revenue' | 'expense';

export type TimePeriodType = '1month' | 'quarter' | 'year' | 'custom';

export type RevenueFormValues = {
  propertyId: number | null;
  renterId: number | null;
  amount: string;
  monthFor: string;
  dateOfPayment: string;
  paymentMethod: PaymentMethod | '';
  notes: string;
};

export type { ExpenseFormValues } from '@/src/features/transactions/schemas/expenseFormSchema';
