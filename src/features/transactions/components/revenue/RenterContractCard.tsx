import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Checkbox, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import type { Renter } from '@/src/shared/types';
import { useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';

type RenterContractCardProps = {
  renter: Renter;
  checked: boolean;
  amount: string;
  overridden: boolean;
  onToggle: () => void;
  onAmountChange: (value: string) => void;
  onToggleOverride: () => void;
  /** Onboarding anchor — only the first card in the list carries it. */
  anchor?: string;
};

export function RenterContractCard({
  renter,
  checked,
  amount,
  overridden,
  onToggle,
  onAmountChange,
  onToggleOverride,
  anchor,
}: RenterContractCardProps) {
  const { t } = useTranslation();
  const anchorRef = useTourAnchor(anchor ?? '');
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const checkboxWidth = 38;

  return (
    <View
      ref={anchor ? anchorRef : undefined}
      collapsable={false}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.outline },
      ]}
    >
      {/* Top row: checkbox + name */}
      <View style={styles.topRow}>
        <Checkbox
          status={checked ? 'checked' : 'unchecked'}
          onPress={onToggle}
        />
        <Text
          variant="bodyLarge"
          style={[styles.name, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {renter.first_name} {renter.last_name}
        </Text>
        {!checked && (
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            {t('transactions.bulkRevenue.perContract', { defaultValue: 'Per contract' })}
          </Text>
        )}
      </View>

      {/* Second row: amount controls, indented under name */}
      {checked && (
        <View style={[styles.amountRow, { paddingLeft: checkboxWidth + spacing.sm }]}>
          {overridden ? (
            <>
              <TextInput
                style={[
                  styles.amountInput,
                  {
                    color: colors.textPrimary,
                    borderColor: colors.outline,
                    backgroundColor: colors.inputFilledBackground,
                  },
                ]}
                value={amount}
                onChangeText={onAmountChange}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <TouchableOpacity onPress={onToggleOverride} style={[styles.chip, { borderColor: colors.outline }]}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('transactions.bulkRevenue.auto', { defaultValue: 'Auto' })}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text variant="bodySmall" style={[styles.perContractLabel, { color: colors.textSecondary }]}>
                {t('transactions.bulkRevenue.perContract', { defaultValue: 'Per contract' })}
              </Text>
              <TouchableOpacity onPress={onToggleOverride} style={[styles.chip, { borderColor: colors.primary }]}>
                <Text variant="labelSmall" style={{ color: colors.primary }}>
                  {t('transactions.bulkRevenue.override', { defaultValue: 'Override' })}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  perContractLabel: {
    fontStyle: 'italic',
    flex: 1,
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 80,
    textAlign: 'right',
    fontSize: 16,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
});
