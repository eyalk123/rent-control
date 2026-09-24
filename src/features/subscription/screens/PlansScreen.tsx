import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';
import { useSubscription } from '../SubscriptionContext';
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
 * **No prices yet, on purpose.** Apple and Google each set their own per-storefront price,
 * and those arrive with the store SDK as localized strings. A hardcoded dollar figure here
 * would be wrong for most storefronts and is the one thing App Review rejects outright. Until
 * the SDK is wired, the cards show the band and what it covers.
 *
 * **No band boundaries either.** The server says which plan covers the portfolio
 * (`required_plan`), and a plan is too small if it ranks below that one. Only the order of
 * the plan ids lives here, never the property counts, so there is nothing to fall out of step
 * with the gate.
 */

/** Paid plans in ascending order. Identifiers only; the boundaries live on the server. */
const PAID_PLANS: Exclude<PlanId, 'free'>[] = ['tier_3_8', 'tier_9_15', 'tier_16_plus'];
const RANK: Record<PlanId, number> = { free: 0, tier_3_8: 1, tier_9_15: 2, tier_16_plus: 3 };

/**
 * In-app purchase is not wired yet: no store products exist to sell. The monthly/yearly
 * choice returns with it. Without prices, flipping a period toggle would change nothing on
 * screen, and a control that visibly does nothing reads as broken.
 */
const PURCHASE_AVAILABLE = false;

export function PlansScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { subscription, loading } = useSubscription();

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

  const canBuy = subscription.plan === 'free';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('subscription.plans.subtitle')}
      </Text>

      <AccountBanner subscription={subscription} />

      {PAID_PLANS.map((plan) => (
        <PlanCard key={plan} plan={plan} subscription={subscription} canBuy={canBuy} />
      ))}

      <Text variant="bodySmall" style={[styles.includes, { color: colors.textSecondary }]}>
        {t('subscription.plans.includes', { assistant: t('subscription.settings.assistant') })}
      </Text>
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
}: {
  plan: Exclude<PlanId, 'free'>;
  subscription: Subscription;
  canBuy: boolean;
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

        {note !== '' && (
          <Text variant="bodySmall" style={[styles.note, { color: colors.textSecondary }]}>
            {note}
          </Text>
        )}

        {canBuy && (
          <Button
            mode={PURCHASE_AVAILABLE ? 'contained' : 'outlined'}
            disabled={!PURCHASE_AVAILABLE}
            style={styles.buy}
          >
            {PURCHASE_AVAILABLE ? t('subscription.plans.choose') : t('subscription.plans.storeSoon')}
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
});
