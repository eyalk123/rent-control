import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';
import type { PlanLimitError } from '../types';

/**
 * Whether a failed request was refused because its property is over the plan's limit.
 *
 * A locked property answers every read with 402 `property_locked` — its detail, its
 * renters, its transactions. Detail screens check this before showing a generic error, so
 * an old link or a notification says what actually happened.
 */
export function isPropertyLockedError(error: unknown): boolean {
  const response = (error as { response?: { status?: number; data?: { detail?: PlanLimitError } } })
    ?.response;
  return response?.status === 402 && response.data?.detail?.error === 'property_locked';
}

/**
 * In-screen state for a property the plan no longer covers.
 *
 * Replaces the detail view rather than showing a disabled one: a locked property cannot be
 * opened at all. Points at the two ways out — a bigger plan, or deleting a property from
 * the list, where the locked row carries the delete button.
 */
export function LockedPropertyState() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <View style={styles.container} testID="locked-property-state">
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryBg }]}>
        <Icon name="lock" size={28} color={colors.primary} />
      </View>
      <Text variant="titleMedium" style={[styles.title, { color: colors.textPrimary }]}>
        {t('subscription.lockedDetail.title')}
      </Text>
      <Text variant="bodyMedium" style={[styles.body, { color: colors.textSecondary }]}>
        {t('subscription.lockedDetail.body')}
      </Text>
      <View style={styles.actions}>
        <Button mode="contained" onPress={() => router.push('/settings/plans' as never)}>
          {t('subscription.lockedDetail.cta')}
        </Button>
        <Button mode="text" onPress={() => router.replace('/(tabs)/properties' as never)}>
          {t('subscription.lockedDetail.back')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontWeight: '700', textAlign: 'center' },
  body: { marginTop: 8, textAlign: 'center', lineHeight: 21, maxWidth: 340 },
  actions: { marginTop: 20, gap: 8, alignItems: 'center' },
});
