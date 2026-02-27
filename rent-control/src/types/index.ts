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
}

// API response wrapper (if backend returns { data: T })
export interface APIResponse<T> {
  data: T;
  message?: string;
}
