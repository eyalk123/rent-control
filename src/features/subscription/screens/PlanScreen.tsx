import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, List, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Icon, type IconName } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';
import { usePropertyContext } from '@/src/features/properties/context/PropertyContext';
import { useSubscription } from '../SubscriptionContext';

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

  const locked = properties.filter((p) => subscription.locked_property_ids.includes(p.id));

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
          {subscription.current_period_end ? (
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {t('subscription.settings.renews', {
                date: formatDate(subscription.current_period_end),
              })}
            </Text>
          ) : null}

          {/* Where the money is taken decides where cancelling happens. An App Store
              subscription cannot be cancelled by us, so a cancel button here would be a
              dead end — the sentence sends people to the right place instead. */}
          {subscription.source ? (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {t(`subscription.settings.managedBy.${subscription.source}`)}
              </Text>
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
        icon="receipt"
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
