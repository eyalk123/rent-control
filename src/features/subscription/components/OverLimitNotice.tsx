import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Icon } from '@/src/shared/components/ui';
import { cardShadow, darkColors, lightColors, radii } from '@/src/core/theme';
import { useSubscription } from '../SubscriptionContext';

/**
 * The one-time explanation of why some properties became read-only.
 *
 * Shown after a subscription lapses or is downgraded, once per plan the account lands in
 * — not once ever. Someone who acknowledges this on the free plan, resubscribes and later
 * drops to a different band has a different number of locked properties; saying nothing
 * the second time would leave them to work it out from a disabled button. The server
 * decides when it is due.
 *
 * Three things in order, because they are the three questions in the reader's head: what
 * happened, what is still true, and what to do about it.
 */
export function OverLimitNotice() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const colors = theme.dark ? darkColors : lightColors;
  const { subscription, showLockNotice, acknowledgeNotice } = useSubscription();

  // Latched. Acknowledging clears `show_lock_notice`, so rendering straight off the flag
  // would make the notice erase itself in the same tick it appeared — told, and never
  // read. The latch holds it for this visit; the server flag stops it returning.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (showLockNotice) {
      setVisible(true);
      // Acknowledged on display, not dismissal: someone who reads it and swipes back has
      // still been told.
      acknowledgeNotice();
    }
  }, [showLockNotice, acknowledgeNotice]);

  if (!visible || !subscription) return null;

  const count = subscription.locked_property_ids.length;
  const limit = subscription.limit ?? 0;

  return (
    <Card style={[styles.card, { backgroundColor: colors.cardBackground }]} mode="contained">
      <Card.Content>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primaryBg }]}>
            <Icon name="lock" size={16} color={colors.primary} />
          </View>
          <Text variant="titleSmall" style={styles.heading}>
            {t('subscription.overLimit.heading', { count })}
          </Text>
        </View>

        <Text
          variant="bodySmall"
          style={[styles.body, { color: colors.textSecondary }]}
        >
          {t('subscription.overLimit.body', { count, limit })}
        </Text>
        <Text variant="bodySmall" style={styles.safe}>
          {t('subscription.overLimit.safe')}
        </Text>

        <View style={styles.actions}>
          <Button
            mode="contained"
            compact
            onPress={() => router.push('/settings/plans' as never)}
          >
            {t('subscription.overLimit.cta')}
          </Button>
          <Button mode="text" compact onPress={() => setVisible(false)}>
            {t('common.dismiss')}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Borderless with the list's shadow, like the property rows it sits above.
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: radii.lg, ...cardShadow },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { flex: 1, fontWeight: '700' },
  body: { lineHeight: 19 },
  safe: { marginTop: 8, fontWeight: '600', lineHeight: 19 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
});
