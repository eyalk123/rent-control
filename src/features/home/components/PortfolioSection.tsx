import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { Icon, type IconName } from '@/src/shared/components/ui/Icon';
import { SkeletonBlock } from '@/src/shared/components/ui/SkeletonBlock';
import { useShimmer } from '@/src/shared/hooks/useShimmer';
import { formatMoney } from '@/src/shared/utils/money';
import { usePropertyContext, useRenterContext, useTransactionSummaryContext } from '@/src/context';

interface StatCardProps {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
  valueColor: string;
  labelColor: string;
  bg: string;
  borderColor: string;
  onPress?: () => void;
}

function StatCard({ icon, iconColor, iconBg, value, label, valueColor, labelColor, bg, borderColor, onPress }: StatCardProps) {
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={ICON_SM} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: valueColor, writingDirection: 'ltr' }]}>{value}</Text>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: bg, borderColor }]} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, { backgroundColor: bg, borderColor }]}>{content}</View>;
}

interface ThisMonthCardProps {
  value: string;
  label: string;
  isProfit: boolean;
  isBreakeven: boolean;
}

function ThisMonthCard({ value, label, isProfit, isBreakeven }: ThisMonthCardProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const bg = isBreakeven ? colors.plNeutralBg : isProfit ? colors.plPositiveBg : colors.plNegativeBg;

  return (
    <View style={[styles.card, styles.thisMonthCard, { backgroundColor: bg }]}>
      <Text style={[styles.thisMonthValue, { writingDirection: 'ltr' }]}>{value}</Text>
      <Text style={styles.thisMonthLabel}>{label}</Text>
    </View>
  );
}

export function PortfolioSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const colors = theme.dark ? darkColors : lightColors;

  const { properties, loading: propLoading } = usePropertyContext();
  const { renters, loading: renterLoading } = useRenterContext();
  const { heroBucket, summaryLoading } = useTransactionSummaryContext();

  const loading = propLoading || renterLoading || summaryLoading;
  const shimmer = useShimmer(loading);

  const propertiesCount = properties.length;
  const rentersCount = renters.length;
  const monthlyPL = heroBucket.profit;
  const isBreakeven = monthlyPL === 0;
  const isProfit = monthlyPL > 0;
  const plSign = isProfit ? '+' : isBreakeven ? '' : '−';

  const navyIconBg = theme.dark ? 'rgba(62,111,168,0.20)' : 'rgba(30,58,95,0.10)';

  if (loading) {
    return (
      <View style={styles.row}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <SkeletonBlock opacity={shimmer} width={32} height={32} borderRadius={10} style={{ marginBottom: spacing.xs, marginTop: spacing.xs }} />
            <SkeletonBlock opacity={shimmer} width="60%" height={16} borderRadius={4} />
            <SkeletonBlock opacity={shimmer} width="70%" height={11} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
        <View style={[styles.card, styles.thisMonthCard]}>
          <SkeletonBlock opacity={shimmer} width="80%" height={22} borderRadius={5} style={{ backgroundColor: 'rgba(250,247,240,0.35)' }} />
          <SkeletonBlock opacity={shimmer} width="65%" height={11} borderRadius={4} style={{ marginTop: 6, backgroundColor: 'rgba(250,247,240,0.35)' }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <StatCard
        icon="home"
        iconColor={colors.primary}
        iconBg={navyIconBg}
        value={String(propertiesCount)}
        label={t('home.properties')}
        valueColor={colors.textPrimary}
        labelColor={colors.textSecondary}
        bg={theme.colors.surface}
        borderColor={theme.colors.outline}
        onPress={() => router.push('/(tabs)/properties')}
      />
      <StatCard
        icon="users"
        iconColor={colors.primary}
        iconBg={navyIconBg}
        value={String(rentersCount)}
        label={t('home.renters')}
        valueColor={colors.textPrimary}
        labelColor={colors.textSecondary}
        bg={theme.colors.surface}
        borderColor={theme.colors.outline}
        onPress={() => router.push('/(tabs)/renters')}
      />
      <ThisMonthCard
        value={`‪${plSign}${formatMoney(Math.abs(monthlyPL))}‬`}
        label={t('home.netProfitMtd')}
        isProfit={isProfit}
        isBreakeven={isBreakeven}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  thisMonthCard: {
    flex: 1.5,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thisMonthValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.22,
    color: '#FAF7F0',
    lineHeight: 26,
  },
  thisMonthLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(250,247,240,0.82)',
    marginTop: 4,
    textAlign: 'center',
  },
});
