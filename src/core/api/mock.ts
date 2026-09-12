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
  Transaction,
  PropertyRenterSummary,
  PropertyFile,
} from '@/src/shared/types';
import { getLeaseEndDate, getRentForMonth } from '@/src/shared/types';

// Set to true to use in-memory mock data when no backend is available.
// The dev web preview (EXPO_PUBLIC_DEV_WEB_PREVIEW=1, see src/core/auth/AuthContext.tsx)
// forces it on — that mode has no auth token, so real API calls would all 401.
export const USE_MOCK_API = process.env.EXPO_PUBLIC_DEV_WEB_PREVIEW === '1';

function toPropertyBrief(p: Property): PropertyBrief {
  return { id: p.id, address: p.address, city: p.city, type: p.type, image_url: p.image_url };
}

const seedProperties: Property[] = [
  // Deliberately complete: every optional column on `Property` carries a value, so there is
  // one property in the preview data that shows what a fully filled record looks like on the
  // detail screen, in the edit form and in a report. Leave it filled - the other four cover
  // the sparse cases.
  {
    id: 1,
    owner_id: 1,
    address: '123 Main St',
    city: 'Austin',
    zip_code: '78701',
    type: 'house',
    sq_ft: 2200,
    image_url: null,
    number_of_rooms: 5,
    parking_numbers: ['A-12', 'B-34'],
    electricity_meter_number: 'EM-001',
    electricity_account_number: 'EA-55120',
    water_meter_number: 'WM-001',
    water_account_number: 'WA-88431',
    property_tax: 4500,
    house_committee: 200,
    property_owner: 'Jane Cooper',
    inventory_notes: 'Fridge, oven and dishwasher stay with the flat. Two AC units (living room, main bedroom), both serviced Mar 2026. Blinds in every room.',
    basic_contract_url: 'https://example.com/files/123-main-st-lease.pdf',
    land_registry_url: 'https://example.com/files/123-main-st-tabu.pdf',
    floor: 3,
    apartment: '12',
    block: '6418',
    plot: '77',
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
    image_url: null,
    number_of_rooms: 3,
    parking_numbers: null,
    electricity_meter_number: null,
    electricity_account_number: null,
    water_meter_number: null,
    water_account_number: null,
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
    image_url: null,
    renters: null,
  },
];

/**
 * Lease start for the payment-cadence fixtures: 1 January, `yearsAgo` years back.
 *
 * January is deliberate — it puts a quarterly cycle on Jan/Apr/Jul/Oct and a yearly one on
 * January, which makes the grid's off-months obvious at a glance. Anchored to the current
 * year so the fixture does not rot the way a literal date would.
 */
function cadenceLeaseStart(yearsAgo: number): string {
  return `${new Date().getFullYear() - yearsAgo}-01-01`;
}

const seedRenters: Renter[] = [
  {
    id: 1,
    property_id: 1,
    first_name: 'Sarah',
    last_name: 'Johnson',
    phone: '512-555-0101',
    email: 'sarah.johnson@email.com',
    lease_years: [{ amount: 2200, type: 'contract' }],
    lease_start: '2025-06-15',
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
    // Two contract years, so 123 Main St has a *current* tenant: it is the one property
    // seeded complete, and a Monthly Rent tile reading em dash would undercut that. Sarah
    // Johnson on the same property stays expired - she is the plain-expiry fixture.
    lease_years: [
      { amount: 1900, type: 'contract' },
      { amount: 1950, type: 'contract' },
    ],
    lease_start: '2025-07-22',
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
    lease_years: [{ amount: 1650, type: 'contract' }],
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
    lease_years: [
      { amount: 2100, type: 'contract' },
      { amount: 2200, type: 'contract' },
      { amount: 2300, type: 'contract' },
    ],
    lease_start: cadenceLeaseStart(1),
    // Quarterly: owes on Jan/Apr/Jul/Oct, three months' rent each time. The payment grid,
    // the bulk revenue form and the overdue engine all have to agree about that.
    number_of_payments: 4,
    payment_type: 'monthly',
    payment_day_of_month: 1,
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
    lease_years: [
      { amount: 1950, type: 'contract' },
      { amount: 2050, type: 'contract' },
      { amount: 2150, type: 'contract' },
    ],
    lease_start: cadenceLeaseStart(1),
    // Yearly: one instalment a year, in January, worth twelve months' rent.
    number_of_payments: 1,
    payment_type: 'monthly',
    payment_day_of_month: 1,
    property: null,
    contact_id: null,
  },
  // Preview fixtures for the two ended-lease treatments.
  //
  // `getRenterLifecycle` reports 'ended' either because the schedule ran out or because the
  // lease was terminated early, and the detail header renders those differently: a plain
  // expiry is a status chip, a termination gets the banner with its date, reason and Reopen
  // action. Sarah Johnson (id 1) and Robert Thompson (id 6) already cover plain expiry, so
  // these two cover termination and a long lease history.
  {
    id: 7,
    property_id: 2,
    first_name: 'Daniel',
    last_name: 'Okafor',
    phone: '512-555-0107',
    email: 'daniel.okafor@email.com',
    // Eight periods, so the capped lease list actually overflows and its scroll indicator
    // and half-cut row can be seen.
    lease_years: [
      { amount: 1650, type: 'contract' },
      { amount: 1650, type: 'option' },
      { amount: 1725, type: 'option' },
      { amount: 1775, type: 'contract' },
      { amount: 1775, type: 'option' },
      { amount: 1850, type: 'option' },
      { amount: 1925, type: 'contract' },
      { amount: 2000, type: 'option' },
    ],
    lease_start: '2018-04-01',
    number_of_payments: 12,
    payment_type: 'monthly',
    payment_day_of_month: 5,
    terminated_on: '2026-02-28',
    termination_reason: 'Moved abroad, gave two months notice',
    insurance_type: 'bank_guarantee',
    insurance_amount: 4200,
    property: null,
    contact_id: null,
  },
  {
    id: 8,
    property_id: 3,
    first_name: 'Noa',
    last_name: 'Shalev',
    phone: '512-555-0108',
    email: 'noa.shalev@email.com',
    // Live lease with a long history: the same overflow case, without the ended states.
    lease_years: [
      { amount: 2000, type: 'contract' },
      { amount: 2000, type: 'option' },
      { amount: 2100, type: 'option' },
      { amount: 2175, type: 'contract' },
      { amount: 2250, type: 'option' },
      { amount: 2325, type: 'option' },
    ],
    lease_start: '2022-09-01',
    number_of_payments: 12,
    payment_type: 'monthly',
    payment_day_of_month: 1,
    insurance_type: 'tenant',
    insurance_amount: 900,
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
    bank_account: null,
    is_active: true,
  },
  {
    id: 2,
    category_ids: [2],
    name: 'City Power Co',
    phone: '512-555-2000',
    email: null,
    notes: null,
    bank_account: null,
    is_active: true,
  },
  {
    id: 3,
    category_ids: [3],
    name: 'Water Utility',
    phone: null,
    email: 'billing@water.com',
    notes: 'Monthly billing',
    bank_account: null,
    is_active: true,
  },
];

const seedTransactions: Transaction[] = [
  {
    id: 1,
    type: 'revenue',
    property_id: 1,
    renter_id: 1,
    payment_method: 'bank_transfer',
    date_of_payment: '2026-03-01',
    month_for: '2026-03-01',
    amount: 2200,
    expected_amount: 2200,
    currency_code: 'ILS',
    category_id: null,
    supplier_id: null,
    notes: null,
    property_name: '123 Main St',
    renter_name: 'Sarah Johnson',
    category_name: null,
    supplier_name: null,
  },
  {
    id: 2,
    type: 'revenue',
    property_id: 1,
    renter_id: 2,
    payment_method: 'bit',
    date_of_payment: '2026-03-15',
    month_for: '2026-03-01',
    amount: 1900,
    expected_amount: 1900,
    currency_code: 'ILS',
    category_id: null,
    supplier_id: null,
    notes: null,
    property_name: '123 Main St',
    renter_name: 'Michael Chen',
    category_name: null,
    supplier_name: null,
  },
  {
    id: 3,
    type: 'revenue',
    property_id: 2,
    renter_id: 3,
    payment_method: 'cash',
    date_of_payment: '2026-03-01',
    month_for: '2026-03-01',
    amount: 1650,
    expected_amount: 1650,
    currency_code: 'ILS',
    category_id: null,
    supplier_id: null,
    notes: null,
    property_name: '456 Oak Avenue',
    renter_name: 'Emily Davis',
    category_name: null,
    supplier_name: null,
  },
  {
    id: 4,
    type: 'expense',
    property_id: 1,
    renter_id: null,
    payment_method: 'bank_transfer',
    date_of_payment: '2026-03-05',
    month_for: null,
    amount: 350,
    expected_amount: null,
    currency_code: 'ILS',
    category_id: 1,
    supplier_id: 1,
    notes: 'Leaky faucet repair',
    property_name: '123 Main St',
    renter_name: null,
    category_name: 'maintenance',
    supplier_name: 'Joe Plumber',
  },
  {
    id: 5,
    type: 'expense',
    property_id: 2,
    renter_id: null,
    payment_method: 'bank_transfer',
    date_of_payment: '2026-03-10',
    month_for: null,
    amount: 120,
    expected_amount: null,
    currency_code: 'ILS',
    category_id: 2,
    supplier_id: 2,
    notes: null,
    property_name: '456 Oak Avenue',
    renter_name: null,
    category_name: 'electricity',
    supplier_name: 'City Power Co',
  },
  {
    id: 6,
    type: 'expense',
    property_id: 3,
    renter_id: null,
    payment_method: 'bank_transfer',
    date_of_payment: '2026-03-10',
    month_for: null,
    amount: 75,
    expected_amount: null,
    currency_code: 'ILS',
    category_id: 3,
    supplier_id: 3,
    notes: 'Monthly water bill',
    property_name: '789 Elm Street',
    renter_name: null,
    category_name: 'water',
    supplier_name: 'Water Utility',
  },
];

/**
 * A long, realistic transaction history for the preview build.
 *
 * The six hand-written seeds above are enough to look at a row, but not enough to exercise
 * the list: pagination, month sections and their totals only misbehave once there are more
 * rows than one page. Deterministic (fixed seed) so page 2 of a run matches page 2 of the
 * next one — a shuffling mock would look exactly like the pagination bug it is here to expose.
 */
function generateHistory(months: number, startId: number): Transaction[] {
  let seed = 0x5eed;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  const renters = seedRenters.filter((r) => r.property_id != null);
  const expenses: Array<{ category_id: number; category_name: string; supplier_id: number; supplier_name: string; label: string }> = [
    { category_id: 1, category_name: 'maintenance', supplier_id: 1, supplier_name: 'Joe Plumber', label: 'Repair call' },
    { category_id: 2, category_name: 'electricity', supplier_id: 2, supplier_name: 'City Power Co', label: 'Electricity bill' },
    { category_id: 3, category_name: 'water', supplier_id: 3, supplier_name: 'Water Utility', label: 'Water bill' },
  ];

  const out: Transaction[] = [];
  let id = startId;
  const today = new Date();

  for (let back = 1; back <= months; back++) {
    const d = new Date(today.getFullYear(), today.getMonth() - back, 1);
    const monthFor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

    for (const r of renters) {
      const property = seedProperties.find((p) => p.id === r.property_id);
      const rent = getRentForMonth(r, monthFor.slice(0, 7)) || r.lease_years?.[0]?.amount || 2000;
      const day = String(Math.min(28, (r.payment_day_of_month ?? 1) + Math.floor(rand() * 3))).padStart(2, '0');
      out.push({
        id: id++,
        type: 'revenue',
        property_id: r.property_id as number,
        renter_id: r.id,
        payment_method: pick(['bank_transfer', 'bit', 'cash', 'check'] as const),
        date_of_payment: `${monthFor.slice(0, 8)}${day}`,
        month_for: monthFor,
        amount: Math.round(rent),
        expected_amount: Math.round(rent),
        currency_code: 'ILS',
        category_id: null,
        category_ids: [],
        supplier_id: null,
        notes: null,
        receipt_image_url: null,
        property_name: property?.address ?? '',
        renter_name: `${r.first_name} ${r.last_name}`,
        category_name: null,
        supplier_name: null,
      });
    }

    const expenseCount = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < expenseCount; i++) {
      const e = pick(expenses);
      const property = pick(seedProperties);
      const day = String(2 + Math.floor(rand() * 26)).padStart(2, '0');
      out.push({
        id: id++,
        type: 'expense',
        property_id: property.id,
        renter_id: null,
        payment_method: 'bank_transfer',
        date_of_payment: `${monthFor.slice(0, 8)}${day}`,
        month_for: null,
        amount: 60 + Math.floor(rand() * 600),
        expected_amount: null,
        currency_code: 'ILS',
        category_id: e.category_id,
        category_ids: [e.category_id],
        supplier_id: e.supplier_id,
        notes: e.label,
        receipt_image_url: null,
        property_name: property.address,
        renter_name: null,
        category_name: e.category_name,
        supplier_name: e.supplier_name,
      });
    }
  }
  return out;
}

let mockProperties: Property[] = [...seedProperties];
let mockRenters: Renter[] = [...seedRenters];
let mockExpenseCategories: ExpenseCategory[] = [...seedExpenseCategories];
let mockSuppliers: Supplier[] = [...seedSuppliers];
let mockTransactions: Transaction[] = [...seedTransactions, ...generateHistory(18, 1000)];
let mockPropertyFiles: PropertyFile[] = [
  {
    id: 1,
    property_id: 1,
    url: 'https://example.com/files/123-main-st-inventory.pdf',
    label: 'Inventory list',
    created_at: '2026-03-01T09:00:00Z',
  },
  {
    id: 2,
    property_id: 1,
    url: 'https://example.com/files/123-main-st-insurance.pdf',
    label: 'Building insurance',
    created_at: '2026-03-04T09:00:00Z',
  },
];
let nextPropertyFileId = 3;
let nextPropertyId = 6;
let nextRenterId = 7;
let nextCategoryId = 6;
let nextSupplierId = 4;
let nextTransactionId = 7;

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
      image_url: data.image_url ?? null,
      number_of_rooms: data.number_of_rooms ?? null,
      parking_numbers: data.parking_numbers ?? null,
      electricity_meter_number: data.electricity_meter_number ?? null,
      electricity_account_number: data.electricity_account_number ?? null,
      water_meter_number: data.water_meter_number ?? null,
      water_account_number: data.water_account_number ?? null,
      property_tax: data.property_tax ?? null,
      house_committee: data.house_committee ?? null,
      property_owner: data.property_owner ?? null,
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
};

/**
 * Property files had no mock at all, so in preview every `/properties/:id/files` call went to
 * the real API and 401'd - which is what blanked the edit form, because its fetch had the file
 * list as an equal leg of a `Promise.all`.
 */
export const mockPropertyFilesApi = {
  getPropertyFiles: async (propertyId: number): Promise<PropertyFile[]> =>
    mockPropertyFiles.filter((f) => f.property_id === propertyId),
  bulkCreatePropertyFiles: async (
    propertyId: number,
    files: { url: string; label: string }[],
  ): Promise<PropertyFile[]> => {
    const created = files.map((f) => ({
      id: nextPropertyFileId++,
      property_id: propertyId,
      url: f.url,
      label: f.label,
      created_at: new Date().toISOString(),
    }));
    mockPropertyFiles = [...created, ...mockPropertyFiles];
    return created;
  },
  deletePropertyFile: async (propertyId: number, fileId: number): Promise<void> => {
    mockPropertyFiles = mockPropertyFiles.filter(
      (f) => !(f.property_id === propertyId && f.id === fileId),
    );
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
      contract_term_years: data.contract_term_years ?? null,
      option_years: data.option_years ?? null,
      base_rent: data.base_rent ?? null,
      rent_escalation_mode: data.rent_escalation_mode ?? null,
      rent_escalation_value: data.rent_escalation_value ?? null,
      number_of_payments: data.number_of_payments ?? null,
      payment_type: data.payment_type ?? null,
      payment_day_of_month: data.payment_day_of_month ?? null,
      insurance_type: data.insurance_type ?? null,
      insurance_amount: data.insurance_amount ?? null,
      property: null,
      contact_id: (data as RenterCreate).contact_id ?? (data as Renter).contact_id ?? null,
      extra_contacts: (data as RenterCreate).extra_contacts ?? (data as Renter).extra_contacts ?? null,
    };
    mockRenters.push(newRenter);
    return mockRentersApi.getRenterById(newRenter.id);
  },
  updateRenter: async (id: number, data: RenterUpdate | Partial<Renter>): Promise<Renter> => {
    const idx = mockRenters.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error('Renter not found');
    // RenterUpdate allows lease_start: null (an explicit clear); the in-memory Renter
    // keeps a plain string, so map a cleared value to '' while an absent key keeps the old.
    mockRenters[idx] = {
      ...mockRenters[idx],
      ...data,
      lease_start: data.lease_start === null ? '' : data.lease_start ?? mockRenters[idx].lease_start,
    };
    return mockRentersApi.getRenterById(id);
  },
  terminateLease: async (
    id: number,
    data: { terminated_on: string; reason?: string | null }
  ): Promise<Renter> => {
    const idx = mockRenters.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error('Renter not found');
    // Mirrors the server: only the two termination columns move. lease_years and
    // cpi_base_index are left exactly as they are.
    mockRenters[idx] = {
      ...mockRenters[idx],
      terminated_on: data.terminated_on,
      termination_reason: data.reason ?? null,
    };
    return mockRentersApi.getRenterById(id);
  },
  undoTermination: async (id: number): Promise<Renter> => {
    const idx = mockRenters.findIndex((x) => x.id === id);
    if (idx < 0) throw new Error('Renter not found');
    mockRenters[idx] = { ...mockRenters[idx], terminated_on: null, termination_reason: null };
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

/** Same ordering as the server's `list` query: effective date desc, then newest first. */
function sortLikeServer(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    const da = a.month_for ?? a.date_of_payment;
    const db = b.month_for ?? b.date_of_payment;
    if (da !== db) return da < db ? 1 : -1;
    return b.id - a.id;
  });
}

/** Stand-in for network time, so paginated screens are exercised the way a device sees them. */
const MOCK_LATENCY_MS = 180;
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const mockTransactionsApi = {
  getTransactions: async (params: {
    type?: 'revenue' | 'expense';
    propertyId?: number;
    renterId?: number;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Transaction[]> => {
    let list = mockTransactions;
    if (params.type) {
      list = list.filter((t) => t.type === params.type);
    }
    if (params.propertyId != null) {
      list = list.filter((t) => t.property_id === params.propertyId);
    }
    if (params.renterId != null) {
      list = list.filter((t) => t.renter_id === params.renterId);
    }
    if (params.search?.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter((t) =>
        (t.property_name ?? '').toLowerCase().includes(q) ||
        (t.renter_name ?? '').toLowerCase().includes(q) ||
        (t.category_name ?? '').toLowerCase().includes(q) ||
        (t.supplier_name ?? '').toLowerCase().includes(q) ||
        (t.notes ?? '').toLowerCase().includes(q)
      );
    }
    // Honour limit/offset. Without this the mock handed back every row on the first
    // request, so `hasMore` went false immediately and the preview build could not
    // reproduce anything that only happens while paging.
    const sorted = sortLikeServer(list);
    if (params.limit == null && params.offset == null) return sorted;
    await delay(MOCK_LATENCY_MS);
    const offset = params.offset ?? 0;
    return sorted.slice(offset, offset + (params.limit ?? sorted.length));
  },
  /**
   * Mirrors the server's `_expected_rent`: what the lease quoted for `monthFor`, to be
   * frozen onto a revenue row. Null whenever there is nothing to quote, which the payment
   * grid reads as "fall back to the live schedule".
   */
  expectedRent: (renterId: number | null | undefined, monthFor: string | null): number | null => {
    if (renterId == null || !monthFor) return null;
    const renter = mockRenters.find((r) => r.id === renterId);
    return renter ? getRentForMonth(renter, monthFor.slice(0, 7)) || null : null;
  },
  addTransaction: (t: Transaction): void => {
    mockTransactions.push({ ...t, id: nextTransactionId++ });
  },
  getPropertyRenters: async (propertyId: number): Promise<PropertyRenterSummary[]> => {
    return mockRenters
      .filter((r) => r.property_id === propertyId)
      .map((r) => ({
        id: r.id,
        first_name: r.first_name,
        last_name: r.last_name,
        monthly_rent: r.lease_years?.[0]?.amount ?? 0,
      }));
  },
};

export const mockHomeApi = {
  getOverdueRenters: async (params?: { property_owner?: string }) => {
    const today = new Date();
    return mockRenters
      .filter((r) => r.property_id != null)
      .filter((r) => !params?.property_owner || mockProperties.find((p) => p.id === r.property_id)?.property_owner === params.property_owner)
      .map((r) => {
        const prop = mockProperties.find((p) => p.id === r.property_id);
        const monthly = r.lease_years?.[0]?.amount ? Math.round(r.lease_years[0].amount / 12) : 0;
        const payDay = r.payment_day_of_month ?? 1;
        const daysOverdue = today.getDate() > payDay ? today.getDate() - payDay : 0;
        return {
          renter_id: r.id,
          first_name: r.first_name,
          last_name: r.last_name,
          property_id: r.property_id,
          property_address: prop?.address ?? null,
          property_city: prop?.city ?? null,
          property_owner: prop?.property_owner ?? null,
          monthly_amount: monthly,
          payment_day_of_month: payDay,
          days_overdue: daysOverdue,
        };
      })
      .filter((r) => r.days_overdue > 0);
  },

  getExpiringRenters: async (params?: { days_until?: number }) => {
    const horizon = params?.days_until ?? 90;
    const today = new Date();
    const results = [];
    for (const r of mockRenters) {
      const endDate = getLeaseEndDate(r);
      if (!endDate) continue;
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / 86400000);
      if (daysLeft < 0 || daysLeft > horizon) continue;
      const prop = mockProperties.find((p) => p.id === r.property_id);
      results.push({
        renter_id: r.id,
        first_name: r.first_name,
        last_name: r.last_name,
        property_id: r.property_id,
        property_address: prop?.address ?? null,
        property_city: prop?.city ?? null,
        property_owner: prop?.property_owner ?? null,
        lease_end_date: endDate.toISOString().slice(0, 10),
        days_until_expiry: daysLeft,
      });
    }
    return results;
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
      bank_account: data.bank_account ?? null,
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
