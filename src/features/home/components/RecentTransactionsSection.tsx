import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui/Icon';
import { formatMoney } from '@/src/shared/utils/money';
import type { MockTransaction } from '@/src/features/home/mock/homeMockData';

interface RecentTransactionsSectionProps {
  items: MockTransaction[];
}

export function RecentTransactionsSection({ items }: RecentTransactionsSectionProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: colors.outline }]}>
      {items.slice(0, 1).map((item, idx) => {
        const isRevenue = item.type === 'revenue';
        const iconName = isRevenue ? 'arrow-up-right' : 'arrow-down-right';
        const iconColor = isRevenue ? colors.revFg : colors.expFg;
        const iconBg = isRevenue ? colors.revBg : colors.expBg;
        const amountColor = isRevenue ? colors.revFg : colors.expFg;
        const sign = isRevenue ? '+' : '−';

        return (
          <View key={item.id}>
            {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.outline }]} />}
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
                <Icon name={iconName} size={ICON_SM} color={iconColor} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.description, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.description}
                </Text>
                <Text style={[styles.property, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.propertyAddress}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={[styles.amount, { color: amountColor }]}>
                  {`${sign}${formatMoney(item.amount)}`}
                </Text>
                <Text style={[styles.date, { color: colors.textSecondary }]}>{item.date}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  property: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  date: {
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -spacing.md,
  },
});
