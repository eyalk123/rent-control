import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Control } from 'react-hook-form';
import { darkColors, lightColors } from '@/src/core/theme';
import { FormRow, FormWheelDateField } from '@/src/shared/components/form';
import { PaymentMethodField } from '@/src/shared/components/form';
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
      {/* Two short picks about the payment, side by side - as on the expense form. */}
      <FormRow>
        <FormWheelDateField
          control={control}
          name="dateOfPayment"
          label={t('transactions.dateOfPayment', { defaultValue: 'Date of payment' })}
          mode="full"
        />
        <PaymentMethodField
          value={paymentMethod}
          onChange={onPaymentMethodChange}
          placeholder={t('common.select')}
        />
      </FormRow>
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
