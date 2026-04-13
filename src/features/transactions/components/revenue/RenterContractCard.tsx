import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Checkbox, Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import type { Renter } from '@/src/shared/types';

type RenterContractCardProps = {
  renter: Renter;
  checked: boolean;
  amount: string;
  onToggle: () => void;
  onAmountChange: (value: string) => void;
};

export function RenterContractCard({
  renter,
  checked,
  amount,
  onToggle,
  onAmountChange,
}: RenterContractCardProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
        },
      ]}
    >
      <View style={styles.row}>
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
        <View style={styles.amountContainer}>
          {checked ? (
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
          ) : (
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
              {amount}
            </Text>
          )}
        </View>
      </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
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
});
