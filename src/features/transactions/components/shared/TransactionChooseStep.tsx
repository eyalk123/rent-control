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
      {/* No title here: FormHeader carries it, like every other add/edit form. */}
      <Text style={[styles.chooseSubtitle, { color: colors.textSecondary }]}>
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
    // Centred on purpose. This is the one screen in the add/edit stack that is not a form -
    // nothing to fill in, nothing to scroll - so the form rule of top-aligning content does
    // not apply, and two primary targets pinned under the header would sit in the hardest
    // part of a tall screen to reach one-handed.
    // 0.8, not 1: centring in the full remaining height pushes the pair below the optical
    // centre now that the header takes space off the top.
    flex: 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chooseSubtitle: {
    fontSize: 15,
    marginBottom: spacing.lg,
    textAlign: 'center',
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
