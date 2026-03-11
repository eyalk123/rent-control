// Property type - backend expects lowercase
export type PropertyType = 'apartment' | 'house' | 'commercial';

// Brief property shape (for nested in renter responses)
export interface PropertyBrief {
  id: number;
  address: string;
  city: string;
  type: PropertyType;
}

// Property - matches backend
export interface Property {
  id: number;
  owner_id: number;
  address: string;
  city: string;
  zip_code: string;
  type: PropertyType;
  sq_ft: number;
  purchase_price: number;
  image_url: string | null;
  number_of_rooms?: number | null;
  parking_numbers?: string[] | null;
  electricity_meter_number?: string | null;
  water_meter_tax?: number | null;
  property_tax?: number | null;
  house_committee?: number | null;
  renters: Renter[] | null;
  /** Enriched on list when renters are fetched; used for occupancy display */
  hasRenters?: boolean;
}

// Renter - matches backend
export interface Renter {
  id: number;
  property_id: number | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  monthly_rent: number;
  lease_start: string;
  lease_end: string;
  number_of_payments?: number | null;
  payment_type?: string | null;
  payment_day_of_month?: number | null;
  insurance_type?: string | null;
  insurance_amount?: number | null;
  property: PropertyBrief | null;
}

// Create payload (what frontend sends on POST /properties)
export interface PropertyCreate {
  address: string;
  city: string;
  zip_code: string;
  type: PropertyType;
  sq_ft: number;
  purchase_price: number;
  image_url?: string | null;
  number_of_rooms?: number | null;
  parking_numbers?: string[] | null;
  electricity_meter_number?: string | null;
  water_meter_tax?: number | null;
  property_tax?: number | null;
  house_committee?: number | null;
}

// Update payload (PATCH /properties/{id}) - all fields optional
export interface PropertyUpdate {
  address?: string;
  city?: string;
  zip_code?: string;
  type?: PropertyType;
  sq_ft?: number;
  purchase_price?: number;
  image_url?: string | null;
  number_of_rooms?: number | null;
  parking_numbers?: string[] | null;
  electricity_meter_number?: string | null;
  water_meter_tax?: number | null;
  property_tax?: number | null;
  house_committee?: number | null;
}

// Create payload (POST /renters)
export interface RenterCreate {
  property_id?: number | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  monthly_rent: number;
  lease_start: string;
  lease_end: string;
  number_of_payments?: number | null;
  payment_type?: string | null;
  payment_day_of_month?: number | null;
  insurance_type?: string | null;
  insurance_amount?: number | null;
}

// Update payload (PATCH /renters/{id}) - all fields optional
export interface RenterUpdate {
  property_id?: number | null;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  monthly_rent?: number;
  lease_start?: string;
  lease_end?: string;
  number_of_payments?: number | null;
  payment_type?: string | null;
  payment_day_of_month?: number | null;
  insurance_type?: string | null;
  insurance_amount?: number | null;
}

// API response wrapper (if backend returns { data: T })
export interface APIResponse<T> {
  data: T;
  message?: string;
}
