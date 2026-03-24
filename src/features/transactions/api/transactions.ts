import apiClient from '@/src/core/api/client';
import { USE_MOCK_API, mockExpenseCategoriesApi, mockTransactionsApi } from '@/src/core/api/mock';
import type {
  Transaction,
  TransactionCreateRevenue,
  TransactionCreateExpense,
  ExpenseCategory,
  ExpenseCategoryCreate,
  PropertyRenterSummary,
} from '@/src/shared/types';

export type TransactionsListParams = {
  type?: 'revenue' | 'expense';
  propertyId?: number;
  renterId?: number;
  search?: string;
};

export async function getTransactions(
  params: TransactionsListParams = {},
): Promise<Transaction[]> {
  if (USE_MOCK_API) {
    return mockTransactionsApi.getTransactions(params);
  }

  const response = await apiClient.get<Transaction[]>('/transactions', {
    params: {
      type: params.type,
      property_id: params.propertyId,
      renter_id: params.renterId,
      q: params.search,
    },
  });

  return response.data;
}

export async function createRevenueTransaction(
  payload: TransactionCreateRevenue,
): Promise<Transaction> {
  if (USE_MOCK_API) {
    return {
      id: Date.now(),
      type: 'revenue',
      property_id: payload.property_id,
      renter_id: payload.renter_id ?? null,
      payment_method: payload.payment_method ?? null,
      date_of_payment: payload.date_of_payment ?? new Date().toISOString().slice(0, 10),
      month_for: payload.month_for,
      amount: payload.amount,
      currency_code: 'ILS',
      category_id: null,
      supplier_id: null,
      notes: payload.notes ?? null,
      property_name: '',
      renter_name: null,
      category_name: null,
      supplier_name: null,
    };
  }

  const response = await apiClient.post<Transaction>(
    '/transactions/revenue',
    payload,
  );
  return response.data;
}

export async function createExpenseTransaction(
  payload: TransactionCreateExpense,
): Promise<Transaction> {
  if (USE_MOCK_API) {
    return {
      id: Date.now(),
      type: 'expense',
      property_id: payload.property_id,
      renter_id: payload.renter_id ?? null,
      payment_method: payload.payment_method,
      date_of_payment: payload.date_of_payment,
      month_for: null,
      amount: payload.amount,
      currency_code: 'ILS',
      category_id: payload.category_id,
      supplier_id: payload.supplier_id ?? null,
      notes: payload.notes ?? null,
      property_name: '',
      renter_name: null,
      category_name: null,
      supplier_name: null,
    };
  }

  const response = await apiClient.post<Transaction>(
    '/transactions/expense',
    payload,
  );
  return response.data;
}

export async function getExpenseCategories(): Promise<ExpenseCategory[]> {
  if (USE_MOCK_API) {
    return mockExpenseCategoriesApi.getExpenseCategories();
  }

  const response = await apiClient.get<ExpenseCategory[]>('/expense-categories');
  return response.data;
}

export async function createExpenseCategory(
  name: string,
): Promise<ExpenseCategory> {
  if (USE_MOCK_API) {
    return mockExpenseCategoriesApi.createExpenseCategory({ name });
  }

  const payload: ExpenseCategoryCreate = { name };
  const response = await apiClient.post<ExpenseCategory>(
    '/expense-categories',
    payload,
  );
  return response.data;
}

export async function getPropertyRenters(
  propertyId: number,
): Promise<PropertyRenterSummary[]> {
  if (USE_MOCK_API) {
    return mockTransactionsApi.getPropertyRenters(propertyId);
  }

  const response = await apiClient.get<PropertyRenterSummary[]>(
    `/properties/${propertyId}/renters`,
  );
  return response.data;
}
