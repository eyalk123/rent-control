import React from 'react';
import { useTranslation } from 'react-i18next';
import { getPaymentMethodOptions } from '@/src/shared/constants/paymentMethods';
import type { PaymentMethod } from '@/src/shared/types';
import { DropdownField } from './DropdownField';

type PaymentMethodFieldProps = {
  value: PaymentMethod | '';
  onChange: (value: PaymentMethod) => void;
  error?: { message?: string } | null;
  required?: boolean;
  /** RHF field name, set only when this field should take part in document-scan review. */
  reviewName?: string;
};

/**
 * A dropdown, not a segmented control.
 *
 * It was a segmented row when there were four methods. At eight (card, mobile payment, PayBox
 * and Other were added) every segment was a few dozen pixels wide and each label truncated
 * to "…", so the field could not be read or reliably tapped. A dropdown takes any number of
 * methods, and is what the web form uses.
 *
 * The value is passed through untouched, so nothing is selected until something is chosen —
 * the old 2x2 grid rendered `value || 'cash'`, which showed Cash as chosen on a form that held
 * no value. Options keep their given order (`sorted={false}`): the common methods come first.
 */
export function PaymentMethodField({
  value,
  onChange,
  error,
  required,
  reviewName,
}: PaymentMethodFieldProps) {
  const { t } = useTranslation();
  const options = React.useMemo(() => getPaymentMethodOptions(t), [t]);

  return (
    <DropdownField
      data={options}
      value={value || null}
      onChange={onChange}
      label={t('transactions.paymentMethod')}
      placeholder={t('transactions.selectPaymentMethod')}
      required={required}
      error={error ?? undefined}
      reviewName={reviewName}
      sorted={false}
    />
  );
}
