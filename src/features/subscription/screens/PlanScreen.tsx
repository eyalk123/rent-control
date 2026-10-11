import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, List, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Icon, type IconName } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';
import { usePropertyContext } from '@/src/features/properties/context/PropertyContext';
import { useSubscription } from '../SubscriptionContext';
import { manageSubscriptions } from '../purchases';

/**
 * What this account's plan is, and what of it has been used.
 *
 * Every number comes from `GET /subscription`; none is derived here. The ceilings live in
 * one place on the server, and a copy in an app that ships on a store review cycle would
 * be wrong for weeks the first time a price moved.
 *
 * There is no purchase button yet — the store products do not exist. That is deliberate:
 * a paywall whose button cannot buy anything is worse than an honest statement of where
 * the account stands.
 */
export function PlanScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const colors = theme.dark ? darkColors : lightColors;
  const { subscription, loading } = useSubscription();
  const { properties } = usePropertyContext();

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

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString(i18n.language, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';

  const periodLine = periodLineKey(subscription.status, subscription.current_period_end);

  const locked = properties.filter((p) => subscription.locked_property_ids.includes(p.id));
  const storeOnThisDevice =
    (subscription.source === 'apple' && Platform.OS === 'ios') ||
    (subscription.source === 'google' && Platform.OS === 'android');

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card mode="outlined" style={[styles.card, { borderColor: colors.outline }]}>
        <Card.Content>
          <Text variant="labelMedium" style={{ color: colors.textSecondary }}>
            {t('subscription.settings.currentPlan')}
          </Text>
          <Text variant="headlineSmall" style={styles.planName}>
            {t(`subscription.plan.${subscription.plan}`)}
          </Text>
          {periodLine ? (
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {t(periodLine, { date: formatDate(subscription.current_period_end) })}
            </Text>
          ) : null}

          {/* Where the money is taken decides where cancelling happens. A store
              subscription cannot be cancelled by us, so the sentence says where, and on
              the device of the store that bills it a button opens that store's own
              manage screen. A subscription from the other store gets the sentence only. */}
          {subscription.source ? (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {t(`subscription.settings.managedBy.${subscription.source}`)}
              </Text>
              {storeOnThisDevice ? (
                <Button
                  mode="text"
                  compact
                  onPress={() => void manageSubscriptions()}
                  style={styles.manage}
                >
                  {t('subscription.settings.manage')}
                </Button>
              ) : null}
            </>
          ) : null}

          {!subscription.enforced ? (
            <Text
              variant="bodySmall"
              style={[styles.note, { color: colors.textSecondary }]}
            >
              {t('subscription.settings.notEnforced')}
            </Text>
          ) : null}

          <Button
            mode={subscription.plan === 'free' ? 'contained' : 'outlined'}
            onPress={() => router.push('/settings/plans' as never)}
            style={styles.seePlans}
          >
            {t('subscription.plans.seePlans')}
          </Button>
        </Card.Content>
      </Card>

      <UsageRow
        icon="home"
        label={t('subscription.settings.properties')}
        value={
          subscription.limit === null
            ? t('subscription.settings.propertiesUnlimited', {
                used: subscription.property_count,
              })
            : t('subscription.settings.propertiesUsage', {
                used: subscription.property_count,
                limit: subscription.limit,
              })
        }
      />
      <UsageRow
        icon="file-text"
        label={t('subscription.settings.leaseScans')}
        value={
          subscription.monthly_lease_scans === null
            ? t('subscription.settings.leaseScansUnlimited')
            : t('subscription.settings.leaseScansUsage', {
                used: subscription.lease_scans_used,
                limit: subscription.monthly_lease_scans,
              })
        }
      />
      <UsageRow
        icon="receipt"
        label={t('subscription.settings.receiptScans')}
        value={
          subscription.monthly_receipt_scans === null
            ? t('subscription.settings.leaseScansUnlimited')
            : t('subscription.settings.leaseScansUsage', {
                used: subscription.receipt_scans_used,
                limit: subscription.monthly_receipt_scans,
              })
        }
      />
      <UsageRow
        icon="sparkles"
        label={t('subscription.settings.assistant')}
        value={
          subscription.agent
            ? t('subscription.settings.assistantIncluded')
            : t('subscription.settings.assistantNotIncluded')
        }
      />

      {/* Which properties are read-only, named and tappable. "Some of your properties" is
          not actionable; a list someone can open is. */}
      {locked.length > 0 ? (
        <>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t('subscription.settings.lockedList')}
          </Text>
          <List.Section>
            {locked.map((property) => (
              <List.Item
                key={property.id}
                title={property.address}
                description={property.city}
                // Logical margin, not `marginLeft`: Paper swaps this slot to the right in
                // RTL, where a physical margin would land on the wrong side and leave the
                // icon flush against the address.
                left={(props) => (
                  <View style={styles.lockedIcon}>
                    <Icon name="lock" size={18} color={props.color} />
                  </View>
                )}
              />
            ))}
          </List.Section>
        </>
      ) : null}
    </ScrollView>
  );
}

/**
 * The line under the plan name. The date alone does not say what happens on it: a
 * cancelled subscription keeps its plan until then and does not renew, and saying
 * "Renews" there tells someone who cancelled that they will be charged again.
 */
function periodLineKey(status: string | null, end: string | null): string | null {
  if (status === 'past_due') return 'subscription.settings.paymentIssue';
  if (!end || status === 'paused') return null;
  if (status === 'expired') return 'subscription.settings.ended';
  if (status === 'canceled') {
    return new Date(end) > new Date() ? 'subscription.settings.ends' : 'subscription.settings.ended';
  }
  return 'subscription.settings.renews';
}

function UsageRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  return (
    <View style={[styles.usageRow, { borderColor: colors.outline }]}>
      <View style={[styles.usageIcon, { backgroundColor: colors.primaryBg }]}>
        <Icon name={icon} size={17} color={colors.primary} />
      </View>
      <View style={styles.usageText}>
        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
        <Text variant="titleSmall" style={styles.usageValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  // Explicit radius: Paper's Card otherwise takes the theme's roundness, which on this
  // short card renders as a stadium rather than a card and does not match the usage rows
  // below it.
  card: { borderWidth: 1, borderRadius: 12, marginBottom: 16 },
  planName: { fontWeight: '700', marginTop: 2, marginBottom: 2 },
  divider: { marginVertical: 12 },
  note: { marginTop: 10, fontStyle: 'italic' },
  seePlans: { marginTop: 14, alignSelf: 'flex-start' },
  manage: { marginTop: 6, alignSelf: 'flex-start', marginStart: -8 },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },
  usageIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  usageText: { flex: 1, gap: 1 },
  usageValue: { fontWeight: '700' },
  sectionTitle: { marginTop: 14, marginBottom: 2, fontWeight: '700' },
  lockedIcon: { marginEnd: 6, justifyContent: 'center' },
});
