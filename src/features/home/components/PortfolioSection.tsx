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
  borderColor: string;
}

function StatCard({ icon, iconColor, iconBg, value, label, valueColor, labelColor, bg, borderColor }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor }]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={ICON_SM} color={iconColor} />
      </View>
      <Text style={[styles.value, { color: valueColor, writingDirection: 'ltr' }]}>{value}</Text>
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </View>
  );
}

interface ThisMonthCardProps {
  value: string;
  label: string;
}

function ThisMonthCard({ value, label }: ThisMonthCardProps) {
  return (
    <View style={[styles.card, styles.thisMonthCard]}>
      <Text style={[styles.thisMonthValue, { writingDirection: 'ltr' }]}>{value}</Text>
      <Text style={styles.thisMonthLabel}>{label}</Text>
    </View>
  );
}

export function PortfolioSection({ data }: PortfolioSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const isProfit = data.monthlyPL >= 0;
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
        borderColor={theme.colors.outline}
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
        borderColor={theme.colors.outline}
      />
      <ThisMonthCard
        value={`${plSign}${formatMoney(Math.abs(data.monthlyPL))}`}
        label={t('home.thisMonthPL')}
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
    paddingHorizontal: spacing.sm,
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
    backgroundColor: '#1F7A60',
    borderWidth: 0,
    alignItems: 'flex-start',
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
  },
});
