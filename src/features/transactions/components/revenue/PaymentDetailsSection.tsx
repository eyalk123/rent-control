import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Control } from 'react-hook-form';
import { darkColors, lightColors } from '@/src/core/theme';
import { FormWheelDateField } from '@/src/shared/components/form';
import { PaymentMethodRadios } from '@/src/features/transactions/components/shared/PaymentMethodRadios';
import type { PaymentMethod } from '@/src/shared/types';

interface PaymentDetailsSectionProps {
  control: Control<{ dateOfPayment: string }>;
  paymentMethod: PaymentMethod | '';
  onPaymentMethodChange: (value: PaymentMethod | '') => void;
}

export function PaymentDetailsSection({
  control,
  paymentMethod,
  onPaymentMethodChange,
}: PaymentDetailsSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <>
      <Text
        variant="labelMedium"
        style={[styles.sectionSubLabel, { color: colors.textSecondary }]}
      >
        {t('transactions.bulkRevenue.paymentDetails', { defaultValue: 'Payment details' })}
      </Text>
      <FormWheelDateField
        control={control}
        name="dateOfPayment"
        label={t('transactions.dateOfPayment', { defaultValue: 'Date of payment' })}
        mode="full"
      />
      <PaymentMethodRadios
        value={paymentMethod}
        onChange={onPaymentMethodChange}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionSubLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: 12,
  },
});
