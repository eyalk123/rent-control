import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import type { PurchasesOffering } from 'react-native-purchases';
import { Icon, type IconName } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { useSubscription } from '../SubscriptionContext';
import {
  PURCHASES_AVAILABLE,
  loadOffering,
  packageFor,
  purchase,
  restore,
  type BillingPeriod,
} from '../purchases';
import type { PlanId, Subscription } from '../types';

/**
 * The plan picker (mobile): where a signed-in landlord chooses a band and a billing period.
 *
 * Same rules as the web picker (`rent-control-web/.../PlansPage.tsx`), and for the same
 * reasons. **Only an account on the free plan is offered a purchase.** A paid plan came from
 * an app store, the web, or a permanent grant, and each gets an explanation instead of a
 * second checkout. Buying in-app on top of an active web subscription would bill the
 * landlord twice through two systems that know nothing about each other.
 *
 * **Prices come only from the store.** Apple and Google each set their own per-storefront
 * price (matched to Paddle's USD / EUR / ILS prices in the consoles), and the SDK hands them
 * over as localized strings. A hardcoded figure here would be wrong for most storefronts and
 * is the one thing App Review rejects outright. A build without a RevenueCat key for this
 * platform shows the bands without prices and says subscribing opens soon.
 *
 * **No band boundaries either.** The server says which plan covers the portfolio
 * (`required_plan`), and a plan is too small if it ranks below that one. Only the order of
 * the plan ids lives here, never the property counts, so there is nothing to fall out of step
 * with the gate.
 */

/** Paid plans in ascending order. Identifiers only; the boundaries live on the server. */
const PAID_PLANS: Exclude<PlanId, 'free'>[] = ['tier_3_8', 'tier_9_15', 'tier_16_plus'];
const RANK: Record<PlanId, number> = { free: 0, tier_3_8: 1, tier_9_15: 2, tier_16_plus: 3 };

/** How long to wait for the webhook to change the plan after the store took the payment. */
const ACTIVATION_POLL_MS = 2500;
const ACTIVATION_TIMEOUT_MS = 45000;

type Activation = 'idle' | 'pending' | 'slow';

export function PlansScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { appAlert } = useAlert();
  const { subscription, loading, refresh } = useSubscription();

  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [offeringFailed, setOfferingFailed] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [activation, setActivation] = useState<Activation>('idle');
  const pollStarted = useRef<number | null>(null);

  const canBuy = subscription?.plan === 'free';
  const selling = PURCHASES_AVAILABLE && canBuy;

  useEffect(() => {
    if (!selling) return;
    let cancelled = false;
    loadOffering()
      .then((o) => {
        if (!cancelled) setOffering(o);
      })
      .catch(() => {
        if (!cancelled) setOfferingFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [selling]);

  // After a purchase the store has the money, but the plan changes only when RevenueCat's
  // webhook reaches the server. Poll until it does, like the web picker's pending state.
  useEffect(() => {
    if (activation === 'idle') return;
    if (subscription && subscription.plan !== 'free') {
      setActivation('idle');
      pollStarted.current = null;
      appAlert('', t('subscription.plans.activated', { plan: t(`subscription.plan.${subscription.plan}`) }));
      return;
    }
    if (activation !== 'pending') return;
    const timer = setTimeout(() => {
      if (pollStarted.current && Date.now() - pollStarted.current > ACTIVATION_TIMEOUT_MS) {
        setActivation('slow');
      } else {
        void refresh();
      }
    }, ACTIVATION_POLL_MS);
    return () => clearTimeout(timer);
  }, [activation, subscription, refresh, appAlert, t]);

  const startActivation = useCallback(() => {
    pollStarted.current = Date.now();
    setActivation('pending');
    void refresh();
  }, [refresh]);

  const buy = useCallback(
    async (plan: Exclude<PlanId, 'free'>) => {
      const pkg = packageFor(offering, plan, period);
      if (!pkg) return;
      setBuying(plan);
      try {
        if ((await purchase(pkg)) === 'purchased') startActivation();
      } catch {
        appAlert(t('error.title'), t('subscription.plans.purchaseFailed'));
      } finally {
        setBuying(null);
      }
    },
    [offering, period, startActivation, appAlert, t],
  );

  const onRestore = useCallback(async () => {
    setRestoring(true);
    try {
      if (await restore()) startActivation();
      else appAlert('', t('subscription.plans.restoreNone'));
    } catch {
      appAlert(t('error.title'), t('subscription.plans.purchaseFailed'));
    } finally {
      setRestoring(false);
    }
  }, [startActivation, appAlert, t]);

  if (loading) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!subscription) {
    return (
      <View style={styles.centre}>
        <Text style={{ color: colors.textSecondary }}>{t('common.errorLoading')}</Text>
      </View>
    );
  }

  const storeName = Platform.OS === 'ios' ? 'apple' : 'google';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('subscription.plans.subtitle')}
      </Text>

      <AccountBanner subscription={subscription} />

      {activation !== 'idle' && (
        <View style={[styles.banner, { backgroundColor: colors.primaryBg }]} accessibilityLiveRegion="polite">
          {activation === 'pending' && <ActivityIndicator size="small" />}
          <Text variant="bodyMedium" style={styles.bannerText}>
            {t(activation === 'pending' ? 'subscription.plans.activating' : 'subscription.plans.activatingSlow')}
          </Text>
        </View>
      )}

      {selling && offering && (
        <SegmentedButtons
          value={period}
          onValueChange={(v) => setPeriod(v as BillingPeriod)}
          buttons={[
            { value: 'monthly', label: t('subscription.plans.monthly') },
            { value: 'yearly', label: t('subscription.plans.yearly') },
          ]}
          style={styles.periods}
        />
      )}
      {selling && offeringFailed && (
        <Text variant="bodySmall" style={[styles.loadFailed, { color: theme.colors.error }]}>
          {t('subscription.plans.storeLoadFailed')}
        </Text>
      )}

      {PAID_PLANS.map((plan) => {
        const pkg = selling ? packageFor(offering, plan, period) : null;
        return (
          <PlanCard
            key={plan}
            plan={plan}
            subscription={subscription}
            canBuy={canBuy}
            price={pkg ? t(`subscription.plans.per_${period}`, { price: pkg.product.priceString }) : null}
            purchasable={Boolean(pkg) && activation === 'idle'}
            buying={buying === plan}
            onBuy={() => void buy(plan)}
          />
        );
      })}

      <Text variant="bodySmall" style={[styles.includes, { color: colors.textSecondary }]}>
        {t('subscription.plans.includes', { assistant: t('subscription.settings.assistant') })}
      </Text>

      {PURCHASES_AVAILABLE && (
        <>
          {/* What App Review requires beside an auto-renewing purchase: that it renews, how to
              cancel, and links to the Terms and the Privacy Policy. */}
          <Text variant="bodySmall" style={[styles.terms, { color: colors.textSecondary }]}>
            {t(`subscription.plans.renewalTerms.${storeName}`)}
          </Text>
          <View style={styles.links}>
            <Button compact mode="text" onPress={() => router.push('/settings/legal/terms' as any)}>
              {t('legal.termsOfService')}
            </Button>
            <Button compact mode="text" onPress={() => router.push('/settings/legal/privacy' as any)}>
              {t('legal.privacyPolicy')}
            </Button>
          </View>
          <Button mode="text" onPress={() => void onRestore()} loading={restoring} disabled={restoring}>
            {t('subscription.plans.restore')}
          </Button>
        </>
      )}
    </ScrollView>
  );
}

/** The one sentence that frames the cards: why one is highlighted, or why nothing is for sale. */
function AccountBanner({ subscription }: { subscription: Subscription }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  let icon: IconName = 'info';
  let text: string;

  if (subscription.plan === 'free') {
    const portfolio = t('subscription.plans.portfolio', { count: subscription.property_count });
    text =
      subscription.required_plan === 'free'
        ? portfolio
        : `${portfolio} ${t('subscription.plans.recommendedHint', {
            plan: t(`subscription.plan.${subscription.required_plan}`),
          })}`;
  } else if (subscription.source === 'apple' || subscription.source === 'google') {
    icon = 'lock';
    text = t(`subscription.settings.managedBy.${subscription.source}`);
  } else if (subscription.source === 'paddle') {
    // Deliberately no in-app purchase path here: this landlord pays on the web, and a
    // store subscription on top would bill them twice.
    icon = 'lock';
    text = t('subscription.plans.webManagedMobile');
  } else {
    icon = 'check';
    text = t('subscription.plans.included', { plan: t(`subscription.plan.${subscription.plan}`) });
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.primaryBg }]} accessibilityRole="text">
      <Icon name={icon} size={16} color={colors.primary} />
      <Text variant="bodyMedium" style={styles.bannerText}>
        {text}
      </Text>
    </View>
  );
}

function PlanCard({
  plan,
  subscription,
  canBuy,
  price,
  purchasable,
  buying,
  onBuy,
}: {
  plan: Exclude<PlanId, 'free'>;
  subscription: Subscription;
  canBuy: boolean;
  /** The store's localized price for the chosen period, or null when not for sale here. */
  price: string | null;
  purchasable: boolean;
  buying: boolean;
  onBuy: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const isCurrent = plan === subscription.plan;
  const isRecommended = canBuy && plan === subscription.required_plan;
  // Offered anyway, with the consequence stated: the landlord may mean to remove
  // properties, and refusing the choice would decide that for them.
  const tooSmall = RANK[plan] < RANK[subscription.required_plan];

  let note = '';
  if (tooSmall) note = t('subscription.plans.tooSmallMobile', { count: subscription.property_count });
  else if (isRecommended) note = t('subscription.plans.recommended');

  return (
    <Card
      mode="outlined"
      style={[
        styles.card,
        {
          borderColor: isRecommended || isCurrent ? colors.primary : colors.outline,
          borderWidth: isRecommended ? 2 : 1,
        },
      ]}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.band}>
            {t(`subscription.plan.${plan}`)}
          </Text>
          {isCurrent && (
            <View style={[styles.currentPill, { backgroundColor: colors.primary }]}>
              <Text variant="labelSmall" style={{ color: colors.onPrimary }}>
                {t('subscription.plans.current')}
              </Text>
            </View>
          )}
        </View>

        {price !== null && (
          <Text variant="titleSmall" style={styles.price}>
            {price}
          </Text>
        )}

        {note !== '' && (
          <Text variant="bodySmall" style={[styles.note, { color: colors.textSecondary }]}>
            {note}
          </Text>
        )}

        {canBuy && (
          <Button
            mode={purchasable ? 'contained' : 'outlined'}
            disabled={!purchasable || buying}
            loading={buying}
            onPress={onBuy}
            style={styles.buy}
          >
            {PURCHASES_AVAILABLE ? t('subscription.plans.choose') : t('subscription.plans.storeSoon')}
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  subtitle: { lineHeight: 21, marginBottom: 14 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  bannerText: { flex: 1, lineHeight: 21 },
  card: { borderRadius: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  band: { fontWeight: '700', flexShrink: 1 },
  currentPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  note: { marginTop: 6, lineHeight: 19 },
  buy: { marginTop: 12 },
  includes: { marginTop: 6, lineHeight: 19 },
  periods: { marginBottom: 14 },
  loadFailed: { marginBottom: 12, lineHeight: 19 },
  price: { marginTop: 6, fontWeight: '600' },
  terms: { marginTop: 16, lineHeight: 19 },
  links: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
});
