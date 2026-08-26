/**
 * Onboarding — anchor inventory (mobile).
 *
 * Every key here is an element a tour points at, *except* the handful marked RESERVED:
 * those name a real element that no current tour step targets. They are kept rather than
 * deleted because each is an element the copy already talks about, and a future step is
 * the obvious use — but nothing plumbs a RESERVED key until a step points at it, so a
 * reserved key is not expected to appear in the app tree.
 *
 * Phase 1 plumbs each non-reserved one: the target component registers itself under this
 * key so the overlay can measure it. Nothing outside this file should invent an anchor
 * string.
 *
 * The `// -> file` comment on each entry is the component that must carry it.
 */
export const ANCHORS = {
  // Tab bar — app/(tabs)/_layout.tsx
  tabHome: 'tab.home',
  tabProperties: 'tab.properties',
  // RESERVED: plumbed on the tab bar, but first-run spends its five steps elsewhere.
  tabRenters: 'tab.renters',
  tabTransactions: 'tab.transactions',
  tabChat: 'tab.chat',

  // Home — src/features/home/
  homeNeedsAttention: 'home.needsAttention',
  homeReportsCard: 'home.reportsCard',
  homeManageNotifications: 'home.manageNotifications',

  // Properties
  propertiesList: 'properties.list',
  // RESERVED: the properties tour explains the cards, not the FAB. Anchor the *add* FAB
  // via AppFab's `anchor` prop if a step ever needs it — never wrap a FAB in TourAnchor.
  propertiesAddButton: 'properties.addButton',
  propertyFormStepper: 'propertyForm.stepper', // -> shared/components/ui Stepper
  propertyFormOwnerField: 'propertyForm.ownerField',

  // Renters
  rentersList: 'renters.list',
  rentersEndedFilter: 'renters.endedFilter',
  renterDetailTimeline: 'renterDetail.timeline', // -> RenterLeaseInfoDisplayCard
  renterDetailExtend: 'renterDetail.extendButton',
  renterDetailEndLease: 'renterDetail.endLeaseButton', // -> EndLeaseDialog trigger

  // Lease form — src/shared/components/form/
  leaseTermBuilder: 'leaseForm.termBuilder', // -> LeaseTermBuilder.tsx
  leaseRentChangeField: 'leaseForm.rentChangeField', // -> RentChangeField.tsx
  leaseBaseRent: 'leaseForm.baseRent',
  leaseYearRows: 'leaseForm.yearRows', // -> LeaseYearRow.tsx
  leaseCpiBase: 'leaseForm.cpiBase', // -> RentChangeField.tsx, the CPI explainer

  // Extend lease — src/features/renters/screens/ExtendLeaseScreen.tsx
  extendYearsStepper: 'extendLease.yearsStepper',
  extendPreview: 'extendLease.preview',

  // Transactions — src/features/transactions/
  transactionsList: 'transactions.list',
  // RESERVED: the `suppliers` seed names this button in prose, but the seed is carried by
  // the transactions add-button step, so nothing points a spotlight at it.
  transactionsSuppliersButton: 'transactions.suppliersButton', // -> SuppliersHeaderButton.tsx
  transactionsAddButton: 'transactions.addButton',
  revenuePropertyPicker: 'revenueForm.propertyPicker',
  // RESERVED: the revenue tour uses its three steps on scope, per-contract and saving.
  revenuePeriodPicker: 'revenueForm.periodPicker', // -> MonthGridPicker
  revenueAmountCell: 'revenueForm.amountCell', // "Per contract" / Override / Auto
  expenseCategoryField: 'expenseForm.categoryField', // -> CategoryMultiPickerField.tsx
  expensePropertyPicker: 'expenseForm.propertyPicker',

  // Suppliers — app/(tabs)/transactions/suppliers/
  suppliersList: 'suppliers.list',
  suppliersCategories: 'suppliers.categories',

  // Notifications — app/notifications/
  notificationsEventList: 'notifications.eventList',
  notificationsRulesEntry: 'notifications.rulesEntry',
  notificationsTemplatesEntry: 'notifications.templatesEntry',
  ruleOffsets: 'rule.offsets',
  ruleScope: 'rule.scope',
  templatePlaceholders: 'templates.placeholderChips',
  templateLanguage: 'templates.languageSwitch',

  // Reports — app/reports/
  reportsCards: 'reports.cards',
  reportsExport: 'reports.exportButton',

  // Scan — app/properties/scan.tsx, app/renters/scan.tsx, app/scan/summary.tsx
  scanPicker: 'scan.picker',
  // RESERVED: the summary lives on a route reached only after an extraction, so the
  // lease-scan tour (which opens on the picker) cannot point at it — see registry.ts.
  scanSummary: 'scan.summary',

  // Chat — app/(tabs)/chat/
  chatInput: 'chat.input',
} as const;

export type AnchorKey = (typeof ANCHORS)[keyof typeof ANCHORS];
