import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Property, Renter } from '@/src/shared/types';
import { getCurrentMonthlyRent } from '@/src/shared/types';
import { getRenterLifecycle } from '@/src/shared/utils/renterStatus';
import { EmptyState, Icon } from '@/src/shared/components/ui';
import { RenterAvatar } from '@/src/features/renters/components/RenterAvatar';
import { lightColors, darkColors, spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';

interface PropertyRentersTabProps {
  property: Property;
}

export function PropertyRentersTab({ property }: PropertyRentersTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();

  const allRenters = property.renters ?? [];
  // Past tenants stay on the property — they are the only record of who was here and
  // what they paid — but they sit under their own heading so the tab reads as
  // "who is here now".
  const current = allRenters.filter((r) => getRenterLifecycle(r) !== 'ended');
  const previous = allRenters.filter((r) => getRenterLifecycle(r) === 'ended');

  if (allRenters.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState message={t('property.noRenters')} icon="user-x" />
      </View>
    );
  }

  const renderRenter = (renter: Renter) => {
    const ended = getRenterLifecycle(renter) === 'ended';
    return (
      <TouchableOpacity
        key={renter.id}
        activeOpacity={0.7}
        onPress={() => router.push(`/renters/${renter.id}` as any)}
      >
        <Card style={styles.card} mode="outlined">
          <Card.Content style={styles.cardContent}>
            <RenterAvatar renter={renter} size={44} style={styles.avatar} />
            <View style={styles.info}>
              <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
                {renter.first_name} {renter.last_name}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {t('renter.monthlyRent')}: {formatMoney(getCurrentMonthlyRent(renter))}/{t('renter.frequencyMonthly').toLowerCase()}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: colors.textSecondary }}
                numberOfLines={1}
              >
                {t('property.lease')}: {renter.lease_start}
              </Text>
            </View>
            <View style={styles.rightSection}>
              {/* Was hard-coded green "Active" for every renter, including leases that
                  ran out years ago. */}
              <View
                style={[
                  styles.badge,
                  { backgroundColor: ended ? colors.textSecondary : colors.success },
                ]}
              >
                <Text variant="labelSmall" style={[styles.badgeText, { color: colors.onPrimary }]}>
                  {t(ended ? 'renter.status.ended' : 'renter.status.active')}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={24}
                color={colors.textSecondary}
              />
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Headings only earn their space once there is more than one group. */}
      {current.length > 0 && previous.length > 0 && (
        <Text variant="labelLarge" style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          {t('property.currentTenants')}
        </Text>
      )}
      {current.map(renderRenter)}

      {previous.length > 0 && (
        <Text variant="labelLarge" style={[styles.sectionHeading, { color: colors.textSecondary }]}>
          {t('renter.previousTenants')}
        </Text>
      )}
      {previous.map(renderRenter)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeading: {
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  card: {
    marginBottom: spacing.sm,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    marginEnd: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
  },
  rightSection: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
  },
});
