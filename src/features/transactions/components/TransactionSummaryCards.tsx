import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';

export interface TransactionSummary {
  revenue: number;
  expenses: number;
  profitLoss: number;
}

interface TransactionSummaryCardsProps {
  summary: TransactionSummary;
}

export function TransactionSummaryCards({ summary }: TransactionSummaryCardsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const profitLossColor =
    summary.profitLoss > 0
      ? colors.chooseRevenueIcon
      : summary.profitLoss < 0
        ? colors.chooseExpenseIcon
        : colors.textSecondary;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.chooseRevenueBg,
            borderColor: colors.outline,
          },
        ]}
      >
        <Text
          style={[styles.label, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {t('transactions.totalRevenue', { defaultValue: 'Total Revenue' })}
        </Text>
        <Text
          style={[styles.amount, { color: colors.chooseRevenueIcon }]}
          numberOfLines={1}
        >
          {formatMoney(summary.revenue)}
        </Text>
      </View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.chooseExpenseBg,
            borderColor: colors.outline,
          },
        ]}
      >
        <Text
          style={[styles.label, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {t('transactions.totalExpenses', {
            defaultValue: 'Total Expenses',
          })}
        </Text>
        <Text
          style={[styles.amount, { color: colors.chooseExpenseIcon }]}
          numberOfLines={1}
        >
          {formatMoney(summary.expenses)}
        </Text>
      </View>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.outline,
          },
        ]}
      >
        <Text
          style={[styles.label, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {t('transactions.profitLoss', {
            defaultValue: 'Profit / Loss',
          })}
        </Text>
        <Text
          style={[styles.amount, { color: profitLossColor }]}
          numberOfLines={1}
        >
          {formatMoney(summary.profitLoss)}
        </Text>
      </View>
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
    padding: spacing.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    alignSelf: 'stretch',
  },
});
