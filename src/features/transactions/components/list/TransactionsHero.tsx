/**
 * Hero P&L header for the Transactions list.
 * Shows the current month's profit/loss as a large number, with a sub-line
 * of revenue/expense totals.
 *
 * Currency is formatted via the existing ILS-aware `formatMoney()` helper.
 */
import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { darkColors, ICON_XS, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import { formatMoney } from '@/src/shared/utils/money';
import { Icon } from '@/src/shared/components/ui';
import {
  heroEyebrow,
  type MonthBucket,
} from '@/src/features/transactions/utils/aggregate';

interface TransactionsHeroProps {
  bucket: MonthBucket;
  loading?: boolean;
}

export const TransactionsHero = React.memo(function TransactionsHero({ bucket, loading = false }: TransactionsHeroProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const shimmer = React.useRef(new Animated.Value(0.35)).current;
  React.useEffect(() => {
    if (!loading) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loading, shimmer]);

  if (loading) {
    const bg = colors.textSecondary;
    return (
      <Animated.View style={[styles.skeletonContainer, { opacity: shimmer }]}>
        <View style={[styles.skeletonEyebrow, { backgroundColor: bg }]} />
        <View style={[styles.skeletonNumber, { backgroundColor: bg }]} />
        <View style={styles.skeletonStatsRow}>
          <View style={[styles.skeletonStat, { backgroundColor: bg }]} />
          <View style={[styles.skeletonStat, { backgroundColor: bg }]} />
        </View>
      </Animated.View>
    );
  }

  const isLoss = bucket.profit < 0;
  const sign = isLoss ? '−' : '+'; // U+2212 minus, not hyphen
  const amount = formatMoney(Math.abs(bucket.profit));
  const numberColor = isLoss ? colors.expFg : colors.textPrimary;

  const eyebrow = heroEyebrow(
    bucket.key,
    locale,
    bucket.profit,
    t('transactions.profit', { defaultValue: 'Profit' }),
    t('transactions.loss', { defaultValue: 'Loss' }),
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.eyebrow, { color: colors.textSecondary }]}>
        {eyebrow}
      </Text>
      <Text style={[styles.bigNumber, { color: numberColor }]}>
        {`${sign}${amount}`}
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Icon name="arrow-up-right" size={ICON_XS} color={colors.revFg} />
          <Text style={[styles.statText, { color: colors.revFg }]}>
            {`${formatMoney(bucket.revenue)} ${t('transactions.revenueLowercase', {
              defaultValue: 'revenue',
            })}`}
          </Text>
        </View>
        <View style={styles.stat}>
          <Icon name="arrow-down-right" size={ICON_XS} color={colors.expFg} />
          <Text style={[styles.statText, { color: colors.expFg }]}>
            {`${formatMoney(bucket.expenses)} ${t('transactions.expensesLowercase', {
              defaultValue: 'expenses',
            })}`}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  bigNumber: {
    fontSize: 44,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -1.5,
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  skeletonContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  skeletonEyebrow: {
    height: 10,
    width: '30%',
    borderRadius: 4,
  },
  skeletonNumber: {
    height: 44,
    width: '55%',
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  skeletonStat: {
    height: 13,
    width: '22%',
    borderRadius: 4,
  },
});
