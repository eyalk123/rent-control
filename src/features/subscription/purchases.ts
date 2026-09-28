/**
 * In-app purchase (mobile), through RevenueCat's SDK over the App Store and Google Play.
 *
 * The twin of the web app's `features/subscription/checkout.ts`. RevenueCat reports every
 * purchase to our server by webhook, and the server alone changes the plan. Nothing here
 * grants anything: after a purchase, the plans screen waits for `GET /subscription` to show it.
 *
 * **The app user id is the Firebase UID, always.** The webhook reads `app_user_id` as the
 * account id, so a purchase made under anything else — including an anonymous RevenueCat id —
 * belongs to nobody and the server ignores it. That is why the SDK is configured only once
 * someone is signed in, and switched with `logIn` when the account changes.
 *
 * **Prices come from the store, never from here.** Each package's `priceString` is already
 * localized to the buyer's storefront (currency, symbol, and the per-country price set in
 * App Store Connect / Play Console to match Paddle).
 *
 * The keys are RevenueCat's *public* SDK keys (`appl_…` / `goog_…`), designed to ship in app
 * code. Without the one for this platform, purchasing is unavailable and the plans screen says
 * so — which is the state of any build made before the store apps existed in RevenueCat.
 */
import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import type { PlanId } from './types';

export type BillingPeriod = 'monthly' | 'yearly';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  default: undefined,
});

/** The dev preview stubs Firebase; there is no real account to buy for. */
const DEV_PREVIEW = __DEV__ && process.env.EXPO_PUBLIC_DEV_WEB_PREVIEW === '1';

export const PURCHASES_AVAILABLE = Boolean(API_KEY) && !DEV_PREVIEW && Platform.OS !== 'web';

/** The offering whose packages the picker sells. Configured in the RevenueCat dashboard. */
const OFFERING_ID = 'default';

let configuredFor: string | null = null;

/** Point the SDK at this account. Safe to call repeatedly; only acts when the account changes. */
export async function identifyPurchaser(uid: string): Promise<void> {
  if (!PURCHASES_AVAILABLE || !API_KEY) return;
  if (configuredFor === uid) return;
  if (configuredFor === null) {
    Purchases.configure({ apiKey: API_KEY, appUserID: uid });
  } else {
    // Another account signed in since the SDK was configured. Buying under the old id would
    // credit the previous account with the new account's money.
    await Purchases.logIn(uid);
  }
  configuredFor = uid;
}

/**
 * Forget the account on sign-out. The SDK cannot be un-configured, so the next sign-in
 * switches it with `logIn` rather than configuring again.
 */
export async function forgetPurchaser(): Promise<void> {
  if (configuredFor === null) return;
  try {
    await Purchases.logOut();
  } catch {
    // logOut throws for an anonymous user; there is nothing to clean up in that case.
  }
  configuredFor = null;
}

/** The six packages, identified `<plan>_<period>` as in the RevenueCat dashboard. */
export async function loadOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.all[OFFERING_ID] ?? offerings.current;
}

export function packageFor(
  offering: PurchasesOffering | null | undefined,
  plan: Exclude<PlanId, 'free'>,
  period: BillingPeriod,
): PurchasesPackage | null {
  return offering?.availablePackages.find((p) => p.identifier === `${plan}_${period}`) ?? null;
}

export type PurchaseOutcome = 'purchased' | 'cancelled';

/**
 * Open the store's purchase sheet for one package.
 *
 * `'purchased'` means the store took the payment. The plan is **not** changed yet: the webhook
 * still has to reach our server, which is what the plans screen's pending state waits for.
 */
export async function purchase(rcPackage: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    await Purchases.purchasePackage(rcPackage);
    return 'purchased';
  } catch (error: any) {
    if (error?.userCancelled || error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return 'cancelled';
    }
    throw error;
  }
}

/**
 * Re-sync store purchases to this account — App Review requires a visible restore action.
 * Returns whether the store knows of any active subscription.
 */
export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return Object.keys(info.entitlements.active).length > 0;
}
