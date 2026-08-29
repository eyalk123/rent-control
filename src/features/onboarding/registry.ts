/**
 * Onboarding — content registry (mobile).
 *
 * Copy lives in i18n under `onboarding.*`; this file holds structure only.
 * Ordering inside a tour is the array order. See types.ts for the model.
 */
import { ANCHORS } from './anchors';
import { assertBudget, type TourDefinition, type TourId } from './types';

export const TOURS = {
  /* ---------------------------------------------------------------- orientation */

  'first-run': {
    id: 'first-run',
    route: '/(tabs)/home',
    gate: 'always',
    kind: 'orientation',
    steps: [
      // The arrival, before the tab bar is pointed at. Shares its copy with web, where
      // the renderer also gives an unanchored first step a larger card; here it draws
      // like any other centred step for now.
      { id: 'welcome', anchor: null, placement: 'center' },
      { id: 'home', anchor: ANCHORS.tabHome, placement: 'top' },
      { id: 'portfolio', anchor: ANCHORS.tabProperties, placement: 'top', seed: { id: 'scan-lease', opens: 'lease-scan' } },
      // Its own step, rather than a clause inside the properties one. The copy was always
      // about both — "properties are the units, renters are the people in them" — while
      // the spotlight sat on Properties alone.
      { id: 'renters', anchor: ANCHORS.tabRenters, placement: 'top' },
      { id: 'money', anchor: ANCHORS.tabTransactions, placement: 'top', seed: { id: 'suppliers', opens: 'suppliers' } },
      { id: 'chat', anchor: ANCHORS.tabChat, placement: 'top' },
      // Dropped once there is a portfolio: it is the closing call to action for someone
      // who still needs it, and noise to everyone else. See `skipWhen` in types.ts.
      { id: 'start', anchor: null, placement: 'center', skipWhen: 'hasProperties' },
    ],
  },

  /**
   * The second half of the first-login sweep: first-run explains the tab bar, this
   * explains the screen you land on. It opens the moment first-run closes, so the two read
   * as one sequence and are budgeted as one (see BUDGET.orientation in types.ts).
   *
   * Deliberately NOT part of first-run: on day one Home is empty, so this waits behind
   * `hasRenters` until the cards have something on them — and the two most hidden routes
   * in the product (Reports, notification settings) are reached from here rather than
   * from the tab bar, because on this platform that is where they actually live.
   *
   * The steps walk the screen top to bottom, in HomeScreen's render order.
   */
  home: {
    id: 'home',
    route: '/(tabs)/home',
    gate: 'hasRenters',
    kind: 'orientation',
    steps: [
      // A beat before the first spotlight, so the sweep does not go from the tab bar
      // straight into one card with nothing saying you have arrived somewhere. Centred and
      // unanchored: the full scrim makes it read as being about the screen as a whole.
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'quickActions', anchor: ANCHORS.homeQuickActions, placement: 'bottom' },
      { id: 'attention', anchor: ANCHORS.homeNeedsAttention, placement: 'bottom', seed: { id: 'alert-actions', opens: null } },
      { id: 'portfolio', anchor: ANCHORS.homePortfolio, placement: 'bottom' },
      { id: 'reports', anchor: ANCHORS.homeReportsCard, placement: 'top', seed: { id: 'reports', opens: 'reports' } },
      { id: 'notifications', anchor: ANCHORS.homeManageNotifications, placement: 'top', seed: { id: 'notifications', opens: 'notifications' } },
      { id: 'recent', anchor: ANCHORS.homeRecent, placement: 'top' },
    ],
  },

  /* ----------------------------------------------------------------- page tours */

  /** Opens on the screen, then walks it top to bottom — chips, list, the add button. */
  'properties-list': {
    id: 'properties-list',
    route: '/(tabs)/properties',
    gate: 'hasProperties',
    kind: 'page',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'persistence', anchor: ANCHORS.propertiesFilters, placement: 'bottom' },
      { id: 'cards', anchor: ANCHORS.propertiesList, placement: 'bottom', seed: { id: 'bulk-select', opens: null } },
      // Shared with the renters tour, which says the same thing about the same control:
      // whichever tab is opened first says it. See `sharedWith`.
      { id: 'add', anchor: ANCHORS.propertiesAddButton, placement: 'top', sharedWith: ['renters-list'] },
    ],
  },

  /**
   * The form tours all open with an unanchored card, the way the tab tours do. It used to be
   * that someone opening this form was told about the owner field without ever being told
   * what the form was or that it had a second page.
   *
   * Only `records` needs revealing here: the owner field sits on page one on this platform,
   * inside BasicInfoCard, where web has it on page two.
   */
  'property-form': {
    id: 'property-form',
    route: '/properties/add',
    gate: 'always',
    kind: 'page',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'twoSteps', anchor: ANCHORS.propertyFormStepper, placement: 'bottom' },
      { id: 'owner', anchor: ANCHORS.propertyFormOwnerField, placement: 'bottom', seed: { id: 'property-owner', opens: null } },
      { id: 'records', anchor: ANCHORS.propertyFormRecords, placement: 'top', revealsAnchor: true },
    ],
  },

  'renters-list': {
    id: 'renters-list',
    route: '/(tabs)/renters',
    gate: 'hasRenters',
    kind: 'page',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'ended', anchor: ANCHORS.rentersEndedFilter, placement: 'bottom', seed: { id: 'ended-tenants', opens: null } },
      { id: 'cards', anchor: ANCHORS.rentersList, placement: 'bottom' },
      // Shared with the properties tour — see the note there.
      { id: 'add', anchor: ANCHORS.rentersAddButton, placement: 'top', sharedWith: ['properties-list'] },
    ],
  },

  /** The densest screen in the product — the only page tour that uses its full budget. */
  /**
   * Covers the renter form as a whole rather than only its lease terms — the opening card is
   * what page one gets, since a card pointing at a name field would be a step per field.
   *
   * Everything after the opener is on page two and marked `revealsAnchor`; the screen shows
   * that page for them. The name stays `lease-form`: the lease is what the tour is mostly
   * about, and renaming it would move every copy key for no gain.
   */
  'lease-form': {
    id: 'lease-form',
    route: '/renters/add',
    gate: 'always',
    kind: 'page',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'term', anchor: ANCHORS.leaseTermBuilder, placement: 'bottom', revealsAnchor: true },
      { id: 'mode', anchor: ANCHORS.leaseRentChangeField, placement: 'bottom', seed: { id: 'cpi', opens: 'cpi-mode' }, revealsAnchor: true },
      { id: 'baseYear', anchor: ANCHORS.leaseBaseRent, placement: 'bottom', seed: { id: 'custom-schedule', opens: 'custom-mode' }, revealsAnchor: true },
      { id: 'payment', anchor: ANCHORS.renterFormPayment, placement: 'top', revealsAnchor: true },
    ],
  },

  'transactions-list': {
    id: 'transactions-list',
    route: '/(tabs)/transactions',
    gate: 'hasProperties',
    kind: 'page',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      // The "nothing is charged automatically" seed rides here rather than on the month
      // step below, which drops when there is no section list to point at.
      { id: 'twoKinds', anchor: ANCHORS.transactionsList, placement: 'bottom', seed: { id: 'no-auto-rent', opens: null } },
      // The suppliers button is the one control on this screen nobody identifies without
      // pressing it, so it gets a spotlight rather than only the seed it used to carry.
      { id: 'suppliers', anchor: ANCHORS.transactionsSuppliersButton, placement: 'bottom' },
      // Points at the first month heading, not the FAB: this step is about how the list is
      // organised, and it sat on the same element as `recording` below, so two steps
      // running about unrelated things spotlighted the same button.
      { id: 'forMonth', anchor: ANCHORS.transactionsMonthHeader, placement: 'bottom', optional: true },
      { id: 'recording', anchor: ANCHORS.transactionsAddButton, placement: 'top', seed: { id: 'bulk-rent', opens: 'revenue-form' } },
    ],
  },

  /**
   * One tenancy, end to end. It used to be three steps that opened cold on a spotlight over
   * the timeline — the only page tour in the product with no opening card — and said nothing
   * about the two thirds of the screen that are not the lease itself.
   *
   * `payments` points at the tab panel and the screen shows the Transactions tab for it: the
   * month grid is the least-discovered thing here, and a step that only *described* it would
   * be describing something the user has never seen. Same demonstration the property form
   * gives its second page — the screen derives the shown tab from the running step and never
   * writes the user's own (see RenterDetailScreen).
   *
   * No `stats` step, which web has: this screen has no KPI strip to point at.
   *
   * `extend` and `end` are `optional` because the buttons are not on every tenancy: an
   * expired lease has no End, a terminated one has neither. Required, they would hold the
   * whole tour shut on those renters — the anchor wait needs every non-optional step present
   * at once — so a portfolio of past tenants would never see this tour at all. Optional, the
   * tour opens on any renter and the two lifecycle steps drop where their controls are absent.
   */
  'renter-detail': {
    id: 'renter-detail',
    route: '/(tabs)/renters/[id]',
    gate: 'hasRenters',
    kind: 'page',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'tabs', anchor: ANCHORS.renterDetailTabs, placement: 'bottom' },
      // `revealsAnchor` rather than plain: the timeline lives on the info tab, and it is
      // this step arriving that shows that tab. Without it the tour would be shut for
      // anyone who opened the page on another tab — a deep link from a notification, or a
      // ?tab= the back button restored.
      { id: 'timeline', anchor: ANCHORS.renterDetailTimeline, placement: 'bottom', revealsAnchor: true },
      { id: 'payments', anchor: ANCHORS.renterDetailPanel, placement: 'top' },
      { id: 'extend', anchor: ANCHORS.renterDetailExtend, placement: 'top', seed: { id: 'extend-lease', opens: 'extend-lease' }, optional: true },
      { id: 'end', anchor: ANCHORS.renterDetailEndLease, placement: 'top', seed: { id: 'end-lease', opens: null }, optional: true },
    ],
  },

  /**
   * The property equivalent, and the screen the properties-list tour has always advertised
   * — "open one for its lease, its tenant, and the money it has made" — while having nothing
   * to say once you got there.
   *
   * Three steps in a row point at the same anchor, which everywhere else in this file is a
   * bug: `forMonth` and `recording` once shared the add button and spotlighted it twice for
   * unrelated reasons. This is the opposite arrangement. The anchor is the tab *panel*, the
   * frame every tab renders into, and what changes between the steps is what is inside it —
   * the tour drives the tab. Holding the spotlight still while the contents change is the
   * point, not an accident of reuse.
   */
  'property-detail': {
    id: 'property-detail',
    route: '/(tabs)/properties/[id]',
    gate: 'hasProperties',
    kind: 'page',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'tabs', anchor: ANCHORS.propertyDetailTabs, placement: 'bottom' },
      { id: 'renters', anchor: ANCHORS.propertyDetailPanel, placement: 'top' },
      { id: 'payments', anchor: ANCHORS.propertyDetailPanel, placement: 'top' },
      { id: 'documents', anchor: ANCHORS.propertyDetailPanel, placement: 'top' },
    ],
  },

  chat: {
    id: 'chat',
    route: '/(tabs)/chat',
    gate: 'hasRenters',
    kind: 'page',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'ask', anchor: ANCHORS.chatInput, placement: 'top' },
      { id: 'scope', anchor: null, placement: 'center' },
    ],
  },

  /* ------------------------------------------------- destinations / elaborations */

  'cpi-mode': {
    id: 'cpi-mode',
    route: '/renters/add',
    gate: 'cpiSelected',
    kind: 'elaboration',
    arrivesFrom: 'cpi',
    steps: [
      { id: 'base', anchor: ANCHORS.leaseCpiBase, placement: 'bottom' },
      { id: 'lag', anchor: null, placement: 'center' },
      { id: 'reanchor', anchor: null, placement: 'center' },
    ],
  },

  'custom-mode': {
    id: 'custom-mode',
    route: '/renters/add',
    gate: 'customSelected',
    kind: 'elaboration',
    arrivesFrom: 'custom-schedule',
    steps: [
      { id: 'perYear', anchor: ANCHORS.leaseYearRows, placement: 'bottom' },
      { id: 'forward', anchor: null, placement: 'center' },
    ],
  },

  /**
   * `page`, not `elaboration`, along with the two below it: a form the user opens and works
   * through is a screen in every sense the ceiling cares about, and three steps was a budget
   * written for something that answers one question. `arrivesFrom` is unaffected by `kind`,
   * so the callback line from the `bulk-rent` seed still shows on the opening card.
   */
  'revenue-form': {
    id: 'revenue-form',
    route: '/transactions/add',
    gate: 'always',
    kind: 'page',
    arrivesFrom: 'bulk-rent',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'scope', anchor: ANCHORS.revenuePropertyPicker, placement: 'bottom' },
      { id: 'period', anchor: ANCHORS.revenuePeriodPicker, placement: 'top' },
      // Optional because the renter rows do not exist until a property is picked, and this
      // tour has to be able to open before that — waiting on them is what kept it shut for
      // anyone who opened the form and simply looked at it. The fact that matters most, that
      // the amounts come from each contract, is said on `scope` above, which is anchored on a
      // field that is always there; this step is the override detail, worth having when the
      // rows happen to be up and not worth blocking the tour for.
      { id: 'perContract', anchor: ANCHORS.revenueAmountCell, placement: 'bottom', optional: true },
      { id: 'saving', anchor: null, placement: 'center' },
    ],
  },

  'expense-form': {
    id: 'expense-form',
    route: '/transactions/add',
    gate: 'always',
    kind: 'page',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      // Screen order: the property picker is the first field on this form and the category
      // field sits four below it. These two were the other way round, so the tour jumped down
      // the form and back up again.
      { id: 'split', anchor: ANCHORS.expensePropertyPicker, placement: 'bottom', seed: { id: 'expense-split', opens: null } },
      { id: 'required', anchor: ANCHORS.expenseCategoryField, placement: 'bottom' },
    ],
  },

  'extend-lease': {
    id: 'extend-lease',
    route: '/renters/extend/[id]',
    gate: 'always',
    kind: 'page',
    arrivesFrom: 'extend-lease',
    steps: [
      { id: 'overview', anchor: null, placement: 'center' },
      { id: 'months', anchor: ANCHORS.extendYearsStepper, placement: 'bottom' },
      { id: 'optionLast', anchor: ANCHORS.extendPreview, placement: 'top' },
    ],
  },

  suppliers: {
    id: 'suppliers',
    route: '/transactions/suppliers',
    gate: 'always',
    kind: 'elaboration',
    arrivesFrom: 'suppliers',
    steps: [
      { id: 'what', anchor: ANCHORS.suppliersList, placement: 'bottom' },
      { id: 'categories', anchor: ANCHORS.suppliersCategories, placement: 'bottom' },
    ],
  },

  notifications: {
    id: 'notifications',
    route: '/notifications',
    gate: 'always',
    kind: 'elaboration',
    arrivesFrom: 'notifications',
    steps: [
      { id: 'events', anchor: ANCHORS.notificationsEventList, placement: 'bottom' },
      { id: 'rules', anchor: ANCHORS.notificationsRulesEntry, placement: 'bottom', seed: { id: 'notification-rules', opens: 'notification-rules' } },
      { id: 'templates', anchor: ANCHORS.notificationsTemplatesEntry, placement: 'bottom', seed: { id: 'whatsapp-templates', opens: 'whatsapp-templates' } },
    ],
  },

  'notification-rules': {
    id: 'notification-rules',
    route: '/notifications/rule',
    gate: 'always',
    kind: 'elaboration',
    arrivesFrom: 'notification-rules',
    steps: [
      { id: 'offsets', anchor: ANCHORS.ruleOffsets, placement: 'bottom' },
      { id: 'scope', anchor: ANCHORS.ruleScope, placement: 'bottom' },
      { id: 'cpiException', anchor: null, placement: 'center' },
    ],
  },

  'whatsapp-templates': {
    id: 'whatsapp-templates',
    route: '/notifications/templates',
    gate: 'always',
    kind: 'elaboration',
    arrivesFrom: 'whatsapp-templates',
    steps: [
      { id: 'placeholders', anchor: ANCHORS.templatePlaceholders, placement: 'bottom' },
      { id: 'perLanguage', anchor: ANCHORS.templateLanguage, placement: 'bottom' },
    ],
  },

  reports: {
    id: 'reports',
    route: '/reports',
    gate: 'always',
    kind: 'elaboration',
    arrivesFrom: 'reports',
    steps: [
      { id: 'two', anchor: ANCHORS.reportsCards, placement: 'bottom' },
      { id: 'export', anchor: ANCHORS.reportsExport, placement: 'bottom' },
    ],
  },

  /**
   * The review step is centred, not anchored. `scanSummary` lives on the summary screen,
   * which is a separate route reached only *after* a document has been extracted — and a
   * tour opens only when every anchored step's element is mounted at once, so pointing at
   * it here would mean this tour could never open. Both remaining steps are promises about
   * what happens next, which is what an elaboration arriving from the `scan-lease` seed is.
   */
  'lease-scan': {
    id: 'lease-scan',
    route: '/properties/scan',
    gate: 'always',
    kind: 'elaboration',
    arrivesFrom: 'scan-lease',
    steps: [
      { id: 'pick', anchor: ANCHORS.scanPicker, placement: 'bottom' },
      { id: 'review', anchor: null, placement: 'center' },
      { id: 'both', anchor: null, placement: 'center' },
    ],
  },
} satisfies Partial<Record<TourId, TourDefinition>>;

export type MobileTourId = keyof typeof TOURS;

/**
 * The registry's structural invariants — everything checkable without i18n loaded.
 *
 * Web asserts this from `e2e/onboarding-registry.spec.ts`, which additionally checks that
 * every step, seed and callback has copy in both languages. Mobile has no test layer, so
 * it runs the same function at import time under `__DEV__` (see the bottom of this file).
 */
export function validateRegistry(): string[] {
  const tours = Object.values(TOURS as Record<string, TourDefinition>);
  const errors = tours.flatMap(assertBudget);
  // A seed that opens a tour this platform does not define advertises a destination that
  // can never open, and fails silently: nothing throws when the user finally gets there.
  const defined = new Set(Object.keys(TOURS));
  const byId = TOURS as Record<string, TourDefinition | undefined>;
  for (const tour of tours) {
    for (const step of tour.steps) {
      if (step.seed?.opens && !defined.has(step.seed.opens)) {
        errors.push(
          `${tour.id}.${step.id}: seed opens '${step.seed.opens}', which this platform has no tour for`,
        );
      }
      // A shared step has to be declared from both ends. Named one way only, one tab
      // suppresses the step while the other still shows it — which looks like working
      // software from either side on its own, and is why this is checked rather than
      // trusted.
      for (const other of step.sharedWith ?? []) {
        const partner = byId[other];
        if (!partner) {
          errors.push(
            `${tour.id}.${step.id}: shared with '${other}', which this platform has no tour for`,
          );
          continue;
        }
        if (!partner.steps.some((s) => s.sharedWith?.includes(tour.id))) {
          errors.push(
            `${tour.id}.${step.id}: shared with '${other}', but nothing there shares back`,
          );
        }
      }
    }
  }
  return errors;
}

// Mobile has no test layer, so the check runs once, when this module is first imported.
// `__DEV__` is compiled out of release builds, so it cannot reach a user, and Metro makes
// a console.error loud enough to notice. The budget is the rule that keeps the two-layer
// design from quietly becoming a firehose again, so it needs to be enforced somewhere.
if (__DEV__) {
  const problems = validateRegistry();
  if (problems.length > 0) {
    console.error('[onboarding] registry is invalid:', problems.join('; '));
  }
}
