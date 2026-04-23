import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { PaymentMethod } from '@/src/shared/types';

type PaymentMethodRadiosProps = {
  value: PaymentMethod | '';
  onChange: (v: PaymentMethod) => void;
};

export function PaymentMethodRadios({ value, onChange }: PaymentMethodRadiosProps) {
  const { t } = useTranslation();

  return (
    <RadioButton.Group
      onValueChange={(v) => onChange(v as PaymentMethod)}
      value={value || 'cash'}
    >
      <View style={styles.radioRow}>
        <RadioButton.Item
          label={t('transactions.paymentMethodBit', { defaultValue: 'Bit' })}
          value="bit"
          position="leading"
        />
        <RadioButton.Item
          label={t('transactions.paymentMethodCash', { defaultValue: 'Cash' })}
          value="cash"
          position="leading"
        />
        <RadioButton.Item
          label={t('transactions.paymentMethodBankTransfer', { defaultValue: 'Bank transfer' })}
          value="bank_transfer"
          position="leading"
        />
        <RadioButton.Item
          label={t('transactions.paymentMethodCheck', { defaultValue: 'Check' })}
          value="check"
          position="leading"
        />
      </View>
    </RadioButton.Group>
  );
}

const styles = StyleSheet.create({
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
