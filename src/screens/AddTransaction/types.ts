import type { PaymentMethod } from '@/src/types';

export type TransactionMode = 'choose' | 'revenue' | 'expense';

export type RevenueFormValues = {
  propertyId: number | null;
  renterId: number | null;
  amount: string;
  monthFor: string;
  dateOfPayment: string;
  paymentMethod: PaymentMethod | '';
  notes: string;
};

export type ExpenseFormValues = {
  propertyId: number | null;
  renterId: number | null;
  amount: string;
  dateOfPayment: string;
  paymentMethod: PaymentMethod | '';
  categoryId: number | null;
  supplierId: number | null;
  notes: string;
};
