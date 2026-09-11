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
  tabRenters: 'tab.renters',
  tabTransactions: 'tab.transactions',
  tabChat: 'tab.chat',

  // Home — src/features/home/ (the home sweep walks these in render order)
  homeQuickActions: 'home.quickActions',
  homeNeedsAttention: 'home.needsAttention',
  homePortfolio: 'home.portfolio',
  homeReportsCard: 'home.reportsCard',
  homeManageNotifications: 'home.manageNotifications',
  homeRecent: 'home.recent',

  // Properties
  propertiesList: 'properties.list',
  propertiesFilters: 'properties.filters', // the chips bar above the list
  // Applied through AppFab's `anchor` prop, which puts it on the button itself — never
  // wrap a FAB in TourAnchor, which would measure its position wrapper instead.
  propertiesAddButton: 'properties.addButton',
  propertyFormStepper: 'propertyForm.stepper', // -> shared/components/ui Stepper
  propertyFormOwnerField: 'propertyForm.ownerField',
  /** The whole of the form's second page — rooms, meters, contract files — under one key
   *  rather than one per field: the tour has a single thing to say about all of it. Unmounted
   *  while page one shows, so the step is `revealsAnchor` and the screen shows that page for
   *  it. Note this sits on page two here and the owner field on page one, which is the other
   *  way round from web. */
  propertyFormRecords: 'propertyForm.records', // -> LeaseInfoCard.tsx

  // Property detail — src/features/properties/screens/PropertyDetailScreen.tsx
  /**
   * No `propertyDetail.stats` here, and no `renterDetail.stats` below: web's detail pages
   * open on a strip of KPI tiles and neither of these screens has one, so the step that
   * points at it exists only in the web registry.
   */
  propertyDetailTabs: 'propertyDetail.tabs',
  /**
   * The panel below that bar. Info, Renters, Transactions and Documents all render into
   * this one frame, and three steps in a row point at it while the tour drives the tab
   * behind it — so the spotlight holds still and its contents change. That is deliberate,
   * and not the same mistake as two steps sharing one button: see registry.ts.
   */
  propertyDetailPanel: 'propertyDetail.tabPanel',

  // Renters
  rentersList: 'renters.list',
  rentersEndedFilter: 'renters.endedFilter', // the lease-status chips bar
  rentersAddButton: 'renters.addButton',     // via AppFab's `anchor` prop
  /** Payment day, type and frequency as one group on the renter form's lease page. The
   *  payment day is what 'overdue' is counted from, which nothing else says out loud. Also
   *  `revealsAnchor` — see `propertyFormRecords`. */
  renterFormPayment: 'renterForm.payment', // -> RenterLeaseInfoCard.tsx
  /** The extra-contacts field at the foot of the renter form's *first* page — a guarantor,
   *  a partner, whoever else is on the lease. The one field on that page a tour stops for:
   *  it is a repeating sub-form rather than an input, and nothing on it says who it is for
   *  or that it is optional. Page one is shown by default but not while a later step is
   *  running, so this is `revealsAnchor` like the page-two steps below it. */
  renterFormExtraContacts: 'renterForm.extraContacts', // -> RenterBasicInfoCard.tsx
  renterDetailTabs: 'renterDetail.tabs', // -> RenterDetailScreen.tsx
  /** The same held-still frame as `propertyDetailPanel` above. */
  renterDetailPanel: 'renterDetail.tabPanel', // -> RenterDetailScreen.tsx
  renterDetailTimeline: 'renterDetail.timeline', // -> RenterLeaseInfoDisplayCard
  /** The pencil beside the avatar. Unlike Extend and End it is on every tenancy, ended or
   *  terminated included — a past record can still need correcting — so its step needs no
   *  `optional`. */
  renterDetailEdit: 'renterDetail.editButton',
  /** Only on a live lease — an ended one has no Extend, a terminated one has neither, so
   *  both steps are `optional` and drop themselves there. See registry.ts. */
  renterDetailExtend: 'renterDetail.extendButton',
  renterDetailMore: 'renterDetail.moreMenu', // overflow; holds the EndLeaseDialog trigger

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
  // The "MARCH 2026" heading above the first month's rows. Only the first section claims
  // the key — it is the grouping the tour points at, not that month — and the screen has
  // no section list at all when there is nothing to show, which is why the step is
  // `optional`.
  transactionsMonthHeader: 'transactions.monthHeader', // -> TransactionSectionHeader.tsx
  // The transactions tour spotlights this now, as well as naming it in the seed: it is the
  // one control on that screen nobody identifies without pressing it.
  transactionsSuppliersButton: 'transactions.suppliersButton', // -> SuppliersHeaderButton.tsx
  transactionsAddButton: 'transactions.addButton',
  revenuePropertyPicker: 'revenueForm.propertyPicker',
  /** One month / chosen months / a contract year. The `period` step points here — it was
   *  reserved while the revenue tour had only three steps to spend. */
  revenuePeriodPicker: 'revenueForm.periodPicker', // -> BulkRevenueFilters.tsx
  revenueAmountCell: 'revenueForm.amountCell', // "Per contract" / Override / Auto
  expenseCategoryField: 'expenseForm.categoryField', // -> CategoryMultiPickerField.tsx
  expensePropertyPicker: 'expenseForm.propertyPicker',

  // Suppliers — app/(tabs)/transactions/suppliers/
  suppliersList: 'suppliers.list',
  suppliersCategories: 'suppliers.categories',
  /** The add/edit form's name field — the opening step's target, and the only field on it
   *  that is required along with the categories. */
  supplierFormName: 'supplierForm.name', // -> SupplierForm.tsx
  /** Bank, branch and account as one group. The one thing on this form that needs saying
   *  out loud: filling it in pays nobody. It is a place to keep the number so it is to
   *  hand when you make the transfer yourself. */
  supplierFormBank: 'supplierForm.bankAccount', // -> SupplierForm.tsx
  supplierFormCategories: 'supplierForm.categories', // -> SupplierForm.tsx

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
  /** The upload prompt *and* the camera/file buttons under it, as one block. The prompt is
   *  the only thing on the screen that says what happens to the file, so a spotlight on the
   *  buttons alone left the explanation outside the cutout. */
  scanPicker: 'scan.picker',
  // RESERVED: the summary lives on a route reached only after an extraction, so the
  // lease-scan tour (which opens on the picker) cannot point at it — see registry.ts.
  scanSummary: 'scan.summary',

  // Chat — app/(tabs)/chat/
  chatInput: 'chat.input',
} as const;

export type AnchorKey = (typeof ANCHORS)[keyof typeof ANCHORS];
