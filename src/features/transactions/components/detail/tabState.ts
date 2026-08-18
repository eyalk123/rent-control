/**
 * Everything the detail screens' Transactions tab lets you choose, in one object.
 *
 * It lives here rather than inside the panels because the detail screens render their tabs
 * conditionally: leaving the Transactions tab unmounts the whole subtree, so panel-local
 * state is gone by the time you come back. The screen outlives the tab, so it holds this and
 * hands it down.
 *
 * The web app parks the same selections in the query string, which additionally survives a
 * refresh and the back button. There is no equivalent here, and a native screen has no
 * refresh to survive.
 */
export interface TransactionsTabState {
  section: 'revenue' | 'expenses';
  /** Revenue year. Only used where the grid shows one year at a time (the property matrix). */
  revYear: number | null;
  expYear: number | null;
  /** 0-11, or null for "every month". */
  expMonth: number | null;
  /** Category label, or null for "every category". */
  expCategory: string | null;
}

export const initialTransactionsTabState: TransactionsTabState = {
  section: 'revenue',
  revYear: null,
  expYear: null,
  expMonth: null,
  expCategory: null,
};
