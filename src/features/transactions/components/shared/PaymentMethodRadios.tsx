import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { PaymentMethod } from '@/src/shared/types';
import { getPaymentMethodOptions } from '@/src/shared/constants/paymentMethods';

type PaymentMethodRadiosProps = {
  value: PaymentMethod | '';
  onChange: (v: PaymentMethod) => void;
};

export function PaymentMethodRadios({ value, onChange }: PaymentMethodRadiosProps) {
  const { t } = useTranslation();
  const options = getPaymentMethodOptions(t);

  return (
    <RadioButton.Group
      onValueChange={(v) => onChange(v as PaymentMethod)}
      value={value || 'cash'}
    >
      <View style={styles.radioRow}>
        {options.map((opt) => (
          <RadioButton.Item
            key={opt.value}
            label={opt.label}
            value={opt.value}
            position="leading"
          />
        ))}
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
