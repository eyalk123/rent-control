import type {
  Property,
  PropertyBrief,
  PropertyCreate,
  PropertyUpdate,
  Renter,
  RenterCreate,
  RenterUpdate,
  Supplier,
  SupplierCreate,
  SupplierUpdate,
  ExpenseCategory,
  ExpenseCategoryCreate,
} from '@/src/shared/types';

// Set to true to use in-memory mock data when no backend is available
export const USE_MOCK_API = false;

function toPropertyBrief(p: Property): PropertyBrief {
  return { id: p.id, address: p.address, city: p.city, type: p.type };
}

const seedProperties: Property[] = [
  {
    id: 1,
    owner_id: 1,
    address: '123 Main St',
    city: 'Austin',
    zip_code: '78701',
    type: 'house',
    sq_ft: 2200,
    purchase_price: 450000,
    image_url: null,
    number_of_rooms: 5,
    parking_numbers: ['A-12', 'B-34'],
    electricity_meter_number: 'EM-001',
    water_meter_tax: 120,
    property_tax: 4500,
    house_committee: 200,
    renters: null,
  },
  {
    id: 2,
    owner_id: 1,
    address: '456 Oak Avenue',
    city: 'Austin',
    zip_code: '78702',
    type: 'apartment',
    sq_ft: 1200,
    purchase_price: 280000,
    image_url: null,
    number_of_rooms: 3,
    parking_numbers: null,
    electricity_meter_number: null,
    water_meter_tax: 80,
    property_tax: 2800,
    house_committee: 150,
    renters: null,
  },
  {
    id: 3,
    owner_id: 1,
    address: '789 Elm Street',
    city: 'Austin',
    zip_code: '78703',
    type: 'apartment',
    sq_ft: 950,
    purchase_price: 320000,
    image_url: null,
    renters: null,
  },
  {
    id: 4,
    owner_id: 1,
    address: '321 Pine Road',
    city: 'Round Rock',
    zip_code: '78664',
    type: 'house',
    sq_ft: 1800,
    purchase_price: 380000,
    image_url: null,
    renters: null,
  },
  {
    id: 5,
    owner_id: 1,
    address: '555 Cedar Lane',
    city: 'Austin',
    zip_code: '78704',
    type: 'commercial',
    sq_ft: 1500,
    purchase_price: 410000,
    image_url: null,
    renters: null,
  },
];

const seedRenters: Renter[] = [
  {
    id: 1,
    property_id: 1,
    first_name: 'Sarah',
    last_name: 'Johnson',
    phone: '512-555-0101',
    email: 'sarah.johnson@email.com',
    lease_years: [{ amount: 26400, type: 'contract' }],
    lease_start: '2024-01-15',
    number_of_payments: 12,
    payment_type: 'monthly',
    payment_day_of_month: 1,
    insurance_type: 'tenant',
    insurance_amount: 150,
    property: null,
    contact_id: null,
  },
  {
    id: 2,
    property_id: 1,
    first_name: 'Michael',
    last_name: 'Chen',
    phone: '512-555-0102',
    email: 'michael.chen@email.com',
    lease_years: [{ amount: 22800, type: 'contract' }],
    lease_start: '2024-03-01',
    number_of_payments: 12,
    payment_type: 'monthly',
    payment_day_of_month: 15,
    property: null,
    contact_id: null,
  },
  {
    id: 3,
    property_id: 2,
    first_name: 'Emily',
    last_name: 'Davis',
    phone: '512-555-0103',
    email: 'emily.davis@email.com',
    lease_years: [{ amount: 19800, type: 'contract' }],
    lease_start: '2024-02-01',
    property: null,
    contact_id: null,
  },
  {
    id: 4,
    property_id: 3,
    first_name: 'James',
    last_name: 'Wilson',
    phone: '512-555-0104',
    email: 'james.wilson@email.com',
    lease_years: [{ amount: 25200, type: 'contract' }],
    lease_start: '2024-04-15',
    property: null,
    contact_id: null,
  },
  {
    id: 5,
    property_id: null,
    first_name: 'Lisa',
    last_name: 'Martinez',
    phone: '512-555-0105',
    email: 'lisa.martinez@email.com',
    lease_years: [],
    lease_start: '',
    property: null,
    contact_id: null,
  },
  {
    id: 6,
    property_id: 4,
    first_name: 'Robert',
    last_name: 'Thompson',
    phone: '512-555-0106',
    email: 'robert.thompson@email.com',
    lease_years: [{ amount: 23400, type: 'contract' }],
    lease_start: '2024-05-01',
    property: null,
    contact_id: null,
  },
];

const seedExpenseCategories: ExpenseCategory[] = [
  { id: 1, key: 'maintenance', is_active: true, sort_order: 1 },
  { id: 2, key: 'electricity', is_active: true, sort_order: 2 },
  { id: 3, key: 'water', is_active: true, sort_order: 3 },
  { id: 4, key: 'repairs', is_active: true, sort_order: 4 },
  { id: 5, key: 'other', is_active: true, sort_order: 5 },
];

const seedSuppliers: Supplier[] = [
  {
    id: 1,
    category_ids: [1, 4],
    name: 'Joe Plumber',
    phone: '512-555-1001',
    email: 'joe@plumber.com',
    notes: null,
    is_active: true,
  },
  {
    id: 2,
    category_ids: [2],
    name: 'City Power Co',
    phone: '512-555-2000',
    email: null,
    notes: null,
    is_active: true,
  },
  {
    id: 3,
    category_ids: [3],
    name: 'Water Utility',
    phone: null,
    email: 'billing@water.com',
    notes: 'Monthly billing',
    is_active: true,
  },
];

let mockProperties: Property[] = [...seedProperties];
let mockRenters: Renter[] = [...seedRenters];
let mockExpenseCategories: ExpenseCategory[] = [...seedExpenseCategories];
let mockSuppliers: Supplier[] = [...seedSuppliers];
let nextPropertyId = 6;
let nextRenterId = 7;
let nextCategoryId = 6;
let nextSupplierId = 4;

export const mockPropertiesApi = {
  getProperties: async (): Promise<Property[]> => {
    return mockProperties.map((p) => ({
      ...p,
      renters: mockRenters.filter((r) => r.property_id === p.id).map((r) => ({
        ...r,
        property: toPropertyBrief(p),
      })),
    }));
  },
  getPropertyById: async (id: number): Promise<Property> => {
    const p = mockProperties.find((x) => x.id === id);
    if (!p) throw new Error('Property not found');
    const renters = mockRenters.filter((r) => r.property_id === id).map((r) => ({
      ...r,
      property: toPropertyBrief(p),
    }));
    return { ...p, renters };
  },
  createProperty: async (data: PropertyCreate | Partial<Property>): Promise<Property> => {
    const newProp: Property = {
      id: nextPropertyId++,
      owner_id: 0,
      address: data.address ?? '',
      city: data.city ?? '',
      zip_code: data.zip_code ?? '',
      type: (data.type ?? 'apartment') as Property['type'],
      sq_ft: data.sq_ft ?? 0,
      purchase_price: data.purchase_price ?? 0,
      image_url: data.image_url ?? null,
      number_of_rooms: data.number_of_rooms ?? null,
      parking_numbers: data.parking_numbers ?? null,
      electricity_meter_number: data.electricity_meter_number ?? null,
      water_meter_tax: data.water_meter_tax ?? null,
      property_tax: data.property_tax ?? null,
      house_committee: data.house_committee ?? null,
      renters: [],
    };
    mockProperties.push(newProp);
    return { ...newProp };
  },
  updateProperty: async (id: number, data: PropertyUpdate | Partial<Property>): Promise<Property> => {
    const idx = mockProperties.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error('Property not found');
    const { renters: _r, ...rest } = data as Partial<Property> & { renters?: unknown };
    mockProperties[idx] = { ...mockProperties[idx], ...rest };
    return mockPropertiesApi.getPropertyById(id);
  },
  deleteProperty: async (id: number): Promise<void> => {
    mockProperties = mockProperties.filter((x) => x.id !== id);
    mockRenters = mockRenters.map((r) =>
      r.property_id === id ? { ...r, property_id: null, property: null } : r
    );
  },
  uploadPropertyImage: async (id: number, _formData: FormData): Promise<Property> => {
    // FormData should have 'file' field per API spec
    const idx = mockProperties.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error('Property not found');
    mockProperties[idx] = { ...mockProperties[idx], image_url: 'https://placehold.co/400x300' };
    return { ...mockProperties[idx] };
  },
};

export const mockRentersApi = {
  getRenters: async (): Promise<Renter[]> => {
    return mockRenters.map((r) => {
      const prop = r.property_id
        ? mockProperties.find((p) => p.id === r.property_id)
        : null;
      return {
        ...r,
        property: prop ? toPropertyBrief(prop) : null,
      };
    });
  },
  getRenterById: async (id: number): Promise<Renter> => {
    const r = mockRenters.find((x) => x.id === id);
    if (!r) throw new Error('Renter not found');
    const prop = r.property_id ? mockProperties.find((p) => p.id === r.property_id) : null;
    return {
      ...r,
      property: prop ? toPropertyBrief(prop) : null,
    };
  },
  createRenter: async (data: RenterCreate | Partial<Renter>): Promise<Renter> => {
    const newRenter: Renter = {
      id: nextRenterId++,
      property_id: data.property_id ?? null,
      first_name: data.first_name ?? '',
      last_name: data.last_name ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      lease_years: (data as RenterCreate).lease_years ?? (data as Renter).lease_years ?? [],
      lease_start: data.lease_start ?? '',
      number_of_payments: data.number_of_payments ?? null,
      payment_type: data.payment_type ?? null,
      payment_day_of_month: data.payment_day_of_month ?? null,
      insurance_type: data.insurance_type ?? null,
      insurance_amount: data.insurance_amount ?? null,
      property: null,
      contact_id: (data as RenterCreate).contact_id ?? (data as Renter).contact_id ?? null,
    };
    mockRenters.push(newRenter);
    return mockRentersApi.getRenterById(newRenter.id);
  },
  updateRenter: async (id: number, data: RenterUpdate | Partial<Renter>): Promise<Renter> => {
    const idx = mockRenters.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error('Renter not found');
    mockRenters[idx] = { ...mockRenters[idx], ...data };
    return mockRentersApi.getRenterById(id);
  },
  deleteRenter: async (id: number): Promise<void> => {
    mockRenters = mockRenters.filter((x) => x.id !== id);
  },
};

export const mockExpenseCategoriesApi = {
  getExpenseCategories: async (): Promise<ExpenseCategory[]> => {
    return [...mockExpenseCategories];
  },
  createExpenseCategory: async (data: ExpenseCategoryCreate): Promise<ExpenseCategory> => {
    const newCat: ExpenseCategory = {
      id: nextCategoryId++,
      name: data.name,
      is_active: true,
      sort_order: mockExpenseCategories.length,
    };
    mockExpenseCategories.push(newCat);
    return { ...newCat };
  },
};

export const mockSuppliersApi = {
  getSuppliers: async (params?: {
    categoryId?: number;
    q?: string;
    includeInactive?: boolean;
  }): Promise<Supplier[]> => {
    let list = mockSuppliers;
    if (!params?.includeInactive) {
      list = list.filter((s) => s.is_active !== false);
    }
    if (params?.categoryId != null) {
      list = list.filter((s) => s.category_ids?.includes(params.categoryId!));
    }
    if (params?.q?.trim()) {
      const q = params.q.toLowerCase().trim();
      list = list.filter((s) => {
        const name = (s.name ?? '').toLowerCase();
        const phone = (s.phone ?? '').toLowerCase();
        const email = (s.email ?? '').toLowerCase();
        return name.includes(q) || phone.includes(q) || email.includes(q);
      });
    }
    return [...list];
  },
  getSupplierById: async (id: number): Promise<Supplier> => {
    const s = mockSuppliers.find((x) => x.id === id);
    if (!s) throw new Error('Supplier not found');
    return { ...s };
  },
  createSupplier: async (data: SupplierCreate): Promise<Supplier> => {
    const newSupplier: Supplier = {
      id: nextSupplierId++,
      category_ids: data.category_ids,
      name: data.name,
      phone: data.phone ?? null,
      email: data.email ?? null,
      notes: data.notes ?? null,
      is_active: true,
    };
    mockSuppliers.push(newSupplier);
    return { ...newSupplier };
  },
  updateSupplier: async (id: number, data: SupplierUpdate): Promise<Supplier> => {
    const idx = mockSuppliers.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error('Supplier not found');
    mockSuppliers[idx] = {
      ...mockSuppliers[idx],
      ...data,
      category_ids: data.category_ids ?? mockSuppliers[idx].category_ids,
    };
    return { ...mockSuppliers[idx] };
  },
};
