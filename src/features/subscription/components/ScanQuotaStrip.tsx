import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';
import { useSubscription } from '../SubscriptionContext';

/**
 * How many AI lease scans are left this month.
 *
 * Shown before the scan, not after it fails. A quota someone discovers by photographing a
 * lease and being refused has already cost them the upload — on a phone, over mobile data,
 * that is a worse trade than it sounds. The number is cheap to show.
 *
 * Renders nothing on a plan with no ceiling: an unlimited allowance is not news, and a
 * permanent "unlimited" strip is furniture in front of the camera button.
 */
export function ScanQuotaStrip() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const colors = theme.dark ? darkColors : lightColors;
  const { subscription } = useSubscription();

  if (!subscription?.enforced || subscription.monthly_lease_scans === null) return null;

  const remaining = Math.max(
    0,
    subscription.monthly_lease_scans - subscription.lease_scans_used,
  );
  const exhausted = remaining === 0;

  return (
    <View
      style={[
        styles.strip,
        {
          backgroundColor: exhausted ? colors.inputFilledBackground : colors.primaryBg,
          borderColor: exhausted ? colors.outline : 'transparent',
        },
      ]}
      accessibilityRole="text"
    >
      <Icon
        name={exhausted ? 'lock' : 'receipt'}
        size={15}
        color={exhausted ? colors.textSecondary : colors.primary}
      />
      <View style={styles.text}>
        <Text variant="labelLarge" style={styles.heading}>
          {exhausted
            ? t('subscription.scanLimit.used', { limit: subscription.monthly_lease_scans })
            : t('subscription.scanLimit.remaining', { count: remaining })}
        </Text>
        {exhausted && (
          <>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {t('subscription.scanLimit.resets', { date: nextMonthLabel(i18n.language) })}
            </Text>
            <Text
              variant="labelMedium"
              style={[styles.link, { color: colors.primary }]}
              onPress={() => router.push('/settings/plans' as never)}
            >
              {t('subscription.scanLimit.upgrade')}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

/**
 * When the allowance comes back: the first of next month.
 *
 * Computed here rather than read from the 402 body, because the strip is shown *before*
 * anything has been refused and there is no error to read it from. The server uses the
 * same calendar-month boundary.
 */
function nextMonthLabel(language: string): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString(language, { month: 'long', day: 'numeric' });
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  text: { flex: 1, gap: 2 },
  heading: { fontWeight: '700' },
  link: { marginTop: 2, fontWeight: '700' },
});
