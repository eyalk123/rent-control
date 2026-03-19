import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Property } from '@/src/shared/types';
import { getRenterMonthlyRent } from '@/src/shared/types';
import { EmptyState } from '@/src/shared/components/ui';
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

  const renters = property.renters ?? [];

  if (renters.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState message={t('property.noRenters')} icon="account-off" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {renters.map((renter) => (
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
                  {t('renter.monthlyRent')}: {formatMoney(getRenterMonthlyRent(renter))}/{t('renter.frequencyMonthly').toLowerCase()}
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
                <View style={[styles.badge, { backgroundColor: colors.success }]}>
                  <Text variant="labelSmall" style={styles.badgeText}>
                    {t('renter.status.active')}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textSecondary}
                />
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      ))}
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
    color: '#FFFFFF',
    fontSize: 11,
  },
});
