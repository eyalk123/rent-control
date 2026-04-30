import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

type TransactionChooseStepProps = {
  onSelectRevenue: () => void;
  onSelectExpense: () => void;
};

export function TransactionChooseStep({
  onSelectRevenue,
  onSelectExpense,
}: TransactionChooseStepProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <View style={styles.chooseContainer}>
      <Text variant="headlineMedium" style={styles.chooseTitle}>
        {t('transactions.addTransaction', { defaultValue: 'Add transaction' })}
      </Text>
      <Text style={styles.chooseSubtitle}>
        {t('transactions.chooseType', { defaultValue: 'What kind of transaction do you want to add?' })}
      </Text>
      <View style={styles.chooseButtonRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.chooseButtonHalf, { backgroundColor: colors.chooseRevenueBg }]}
          onPress={onSelectRevenue}
        >
          <View style={styles.chooseButtonInner}>
            <Icon
              name="plus-circle"
              size={40}
              color={colors.chooseRevenueIcon}
              strokeWidth={1.75}
            />
            <Text variant="labelLarge" style={[styles.chooseButtonLabel, { color: colors.chooseRevenueIcon }]}>
              {t('transactions.addRevenue', { defaultValue: 'Add revenue' })}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.chooseButtonHalf, { backgroundColor: colors.chooseExpenseBg }]}
          onPress={onSelectExpense}
        >
          <View style={styles.chooseButtonInner}>
            <Icon
              name="minus-circle"
              size={40}
              color={colors.chooseExpenseIcon}
              strokeWidth={1.75}
            />
            <Text variant="labelLarge" style={[styles.chooseButtonLabel, { color: colors.chooseExpenseIcon }]}>
              {t('transactions.addExpense', { defaultValue: 'Add expense' })}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chooseContainer: {
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chooseTitle: {
    fontWeight: '700',
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  chooseSubtitle: {
    marginBottom: spacing.lg,
  },
  chooseButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  chooseButtonHalf: {
    flex: 1,
    borderRadius: 12,
    minHeight: 96,
    justifyContent: 'center',
  },
  chooseButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chooseButtonLabel: {
    fontWeight: '500',
  },
});
