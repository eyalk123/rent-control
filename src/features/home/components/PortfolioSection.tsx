import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { Icon, type IconName } from '@/src/shared/components/ui/Icon';
import { formatMoney } from '@/src/shared/utils/money';
import type { MockPortfolio } from '@/src/features/home/mock/homeMockData';

interface PortfolioSectionProps {
  data: MockPortfolio;
}

interface StatCardProps {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
  valueColor: string;
  labelColor: string;
  bg: string;
}

function StatCard({ icon, iconColor, iconBg, value, label, valueColor, labelColor, accentBar, bg }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={ICON_SM} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

export function PortfolioSection({ data }: PortfolioSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const isProfit = data.monthlyPL >= 0;
  const plColor = isProfit ? colors.revFg : colors.expFg;
  const plBg = isProfit ? colors.revBg : colors.expBg;
  const plIcon: IconName = isProfit ? 'trending-up' : 'trending-down';
  const plSign = isProfit ? '+' : '−';

  const navyIconBg = theme.dark ? 'rgba(62,111,168,0.20)' : 'rgba(30,58,95,0.10)';

  return (
    <View style={styles.row}>
      <StatCard
        icon="home"
        iconColor={colors.primary}
        iconBg={navyIconBg}
        value={String(data.properties)}
        label={t('home.properties')}
        valueColor={colors.textPrimary}
        labelColor={colors.textSecondary}
        bg={theme.colors.surface}
      />
      <StatCard
        icon="users"
        iconColor={colors.primary}
        iconBg={navyIconBg}
        value={String(data.renters)}
        label={t('home.renters')}
        valueColor={colors.textPrimary}
        labelColor={colors.textSecondary}
        bg={theme.colors.surface}
      />
      <StatCard
        icon={plIcon}
        iconColor={plColor}
        iconBg={plBg}
        value={`${plSign}${formatMoney(Math.abs(data.monthlyPL))}`}
        label={t('home.thisMonthPL')}
        valueColor={plColor}
        labelColor={plColor}
        bg={plBg}
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    overflow: 'hidden',
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
});
