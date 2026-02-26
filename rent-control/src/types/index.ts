// Property - matches backend
export interface Property {
  id: number;
  owner_id: number;
  address: string;
  city: string;
  zip_code: string;
  type: string;
  sq_ft: number;
  purchase_price: number;
  image_url: string | null;
  renters: Renter[] | null;
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
  property: Property | null;
}

// API response wrapper (if backend returns { data: T })
export interface APIResponse<T> {
  data: T;
  message?: string;
}
