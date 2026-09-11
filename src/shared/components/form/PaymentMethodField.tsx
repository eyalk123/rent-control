import React from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@/src/shared/components/ui/SegmentedControl';
import { getPaymentMethodOptions } from '@/src/shared/constants/paymentMethods';
import type { PaymentMethod } from '@/src/shared/types';
import { FormField } from './FormField';

type PaymentMethodFieldProps = {
  value: PaymentMethod | '';
  onChange: (value: PaymentMethod) => void;
  error?: { message?: string } | null;
  required?: boolean;
};

/**
 * Replaces the 2x2 radio grid.
 *
 * Two things were wrong with that grid beyond its age. It had no label at all, so the one
 * control on the transaction form that needed a heading was the only one without one. And it
 * rendered `value || 'cash'`, which drew Cash as chosen even when the form held no value -
 * on the revenue form, whose default is '' and whose schema permits '', you could save a
 * transaction with no payment method after seeing Cash selected the whole time. The value is
 * passed through untouched now, so nothing is selected until something is chosen.
 *
 * `fitContent` because "Bank transfer" is three times the width of "Bit"; equal columns would
 * truncate it.
 */
export function PaymentMethodField({
  value,
  onChange,
  error,
  required,
}: PaymentMethodFieldProps) {
  const { t } = useTranslation();
  const options = React.useMemo(() => getPaymentMethodOptions(t), [t]);

  return (
    <FormField
      label={t('transactions.paymentMethod')}
      required={required}
      error={error}
    >
      <SegmentedControl
        segments={options}
        value={value || undefined}
        onChange={onChange}
        fitContent
        style={styles.control}
      />
    </FormField>
  );
}

const styles = StyleSheet.create({
  // FormField already owns the gap to the next field.
  control: {
    marginBottom: 0,
  },
});
