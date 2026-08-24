/**
 * Onboarding — anchor inventory (mobile).
 *
 * Every key here is an element a tour points at. Phase 1 plumbs each one: the target
 * component registers itself under this key so the overlay can measure it. Nothing
 * outside this file should invent an anchor string.
 *
 * The `// -> file` comment on each entry is the component that must carry it.
 */
export const ANCHORS = {
  // Tab bar — app/(tabs)/_layout.tsx
  tabHome: 'tab.home',
  tabProperties: 'tab.properties',
  tabRenters: 'tab.renters',
  tabTransactions: 'tab.transactions',
  tabChat: 'tab.chat',

  // Home — src/features/home/
  homeNeedsAttention: 'home.needsAttention',
  homeReportsCard: 'home.reportsCard',
  homeManageNotifications: 'home.manageNotifications',

  // Properties
  propertiesList: 'properties.list',
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
  leaseCpiBase: 'leaseForm.cpiBase', // -> EscalationValueField.tsx

  // Extend lease — src/features/renters/screens/ExtendLeaseScreen.tsx
  extendYearsStepper: 'extendLease.yearsStepper',
  extendPreview: 'extendLease.preview',

  // Transactions — src/features/transactions/
  transactionsList: 'transactions.list',
  transactionsSuppliersButton: 'transactions.suppliersButton', // -> SuppliersHeaderButton.tsx
  transactionsAddButton: 'transactions.addButton',
  revenuePropertyPicker: 'revenueForm.propertyPicker',
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
  scanSummary: 'scan.summary',

  // Chat — app/(tabs)/chat/
  chatInput: 'chat.input',
} as const;

export type AnchorKey = (typeof ANCHORS)[keyof typeof ANCHORS];
