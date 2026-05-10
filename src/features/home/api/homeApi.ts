import apiClient from '@/src/core/api/client';

export interface OverdueRenter {
  renter_id: number;
  first_name: string;
  last_name: string;
  property_id: number | null;
  property_address: string | null;
  property_city: string | null;
  property_owner: string | null;
  monthly_amount: number;
  payment_day_of_month: number;
  days_overdue: number;
}

export interface OverdueParams {
  property_owner?: string;
}

export async function getOverdueRenters(params?: OverdueParams): Promise<OverdueRenter[]> {
  const { data } = await apiClient.get<OverdueRenter[]>('/renters/overdue', { params });
  return data;
}
