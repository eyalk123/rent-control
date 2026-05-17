export interface MockPortfolio {
  properties: number;
  renters: number;
  monthlyPL: number;
}

export interface MockExpiringLease {
  id: string;
  name: string;
  propertyAddress: string;
  expiresAt: string; // ISO date
  daysLeft: number;
}

export interface MockOverdueRent {
  id: string;
  name: string;
  propertyAddress: string;
  amount: number;
  daysOverdue: number;
}

export const MOCK_PORTFOLIO: MockPortfolio = {
  properties: 4,
  renters: 6,
  monthlyPL: 8400,
};

export const MOCK_EXPIRING: MockExpiringLease[] = [
  { id: '1', name: 'Ben Katz', propertyAddress: 'Herzl 12, Tel Aviv', expiresAt: '2026-07-12', daysLeft: 63 },
  { id: '2', name: 'Noa Rosen', propertyAddress: 'Weizmann 5, Ramat Gan', expiresAt: '2026-08-03', daysLeft: 85 },
  { id: '3', name: 'Tal Mizrahi', propertyAddress: 'Ben Gurion 8, Haifa', expiresAt: '2026-08-29', daysLeft: 111 },
  { id: '4', name: 'Dana Cohen', propertyAddress: 'Allenby 44, Tel Aviv', expiresAt: '2026-07-22', daysLeft: 73 },
];

export const MOCK_OVERDUE: MockOverdueRent[] = [
  { id: '1', name: 'John Doe', propertyAddress: 'Allenby 22, Tel Aviv', amount: 3200, daysOverdue: 5 },
  { id: '2', name: 'Sara Maman', propertyAddress: "HaNevi'im 3, Jerusalem", amount: 4500, daysOverdue: 12 },
  { id: '3', name: 'Yossi Levi', propertyAddress: 'Dizengoff 100, Tel Aviv', amount: 2800, daysOverdue: 3 },
];

