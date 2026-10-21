import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Checkbox, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing, useEntityColor } from '@/src/core/theme';
import type { Renter } from '@/src/shared/types';
import { formatMoney } from '@/src/shared/utils/money';
import { RenterAvatar } from '@/src/features/renters/components/RenterAvatar';
import { useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';

type RenterContractCardProps = {
  renter: Renter;
  checked: boolean;
  amount: string;
  overridden: boolean;
  onToggle: () => void;
  onAmountChange: (value: string) => void;
  onToggleOverride: () => void;
  /**
   * What the chosen period will actually write for this renter, when that is not simply
   * "the months you picked" — a quarterly lease owes once per quarter, and the whole
   * instalment when it does. Null on a monthly lease, which needs no explaining.
   */
  cadenceNote?: string | null;
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
  cadenceNote,
  anchor,
}: RenterContractCardProps) {
  const { t } = useTranslation();
  const anchorRef = useTourAnchor(anchor ?? '');
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const itemColor = useEntityColor(renter.color);
  const amountNumber = Number(amount);

  // One row, like a renter row elsewhere: initials on the renter's color, the name with what
  // the period will write under it, the amount, and the checkbox at the end. Picking the
  // amount by hand stays: "Override" turns the amount into an input, "Auto" goes back.
  return (
    <View
      ref={anchor ? anchorRef : undefined}
      collapsable={false}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.outline },
      ]}
    >
      <View style={styles.row}>
        <RenterAvatar
          renter={renter}
          size={38}
          radius={11}
          backgroundColor={itemColor.bg}
          textColor={itemColor.fg}
        />
        <View style={styles.text}>
          <Text
            variant="bodyLarge"
            style={[styles.name, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {renter.first_name} {renter.last_name}
          </Text>
          <View style={styles.subRow}>
            {/* A non-monthly lease, or one that misses the period, says what the save will
                actually do, rather than letting it quietly differ from the period picker. */}
            <Text variant="bodySmall" style={[styles.sub, { color: colors.textSecondary }]}>
              {cadenceNote ??
                (overridden
                  ? t('transactions.amount', { defaultValue: 'Amount' })
                  : t('transactions.bulkRevenue.perContract', { defaultValue: 'Per contract' }))}
            </Text>
            {checked ? (
              <TouchableOpacity
                onPress={onToggleOverride}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                style={[styles.chip, { borderColor: overridden ? colors.outline : colors.primary }]}
              >
                <Text variant="labelSmall" style={{ color: overridden ? colors.textSecondary : colors.primary }}>
                  {overridden
                    ? t('transactions.bulkRevenue.auto', { defaultValue: 'Auto' })
                    : t('transactions.bulkRevenue.override', { defaultValue: 'Override' })}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        {checked && overridden ? (
          <TextInput
            style={[
              styles.amountInput,
              {
                color: colors.textPrimary,
                borderColor: colors.inputBorder,
              },
            ]}
            value={amount}
            onChangeText={onAmountChange}
            keyboardType="numeric"
            inputAccessoryViewButtonLabel={t("common.keyboardDone")}
            selectTextOnFocus
          />
        ) : amountNumber > 0 ? (
          <Text style={[styles.amount, { color: colors.textPrimary }]}>{formatMoney(amountNumber)}</Text>
        ) : null}
        <Checkbox.Android
          status={checked ? 'checked' : 'unchecked'}
          onPress={onToggle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.xs,
    paddingStart: spacing.sm + 2,
    paddingEnd: spacing.xs,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontWeight: '500',
    textAlign: 'left',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sub: {
    flexShrink: 1,
    textAlign: 'left',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    minWidth: 84,
    textAlign: 'right',
    fontSize: 16,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
});
