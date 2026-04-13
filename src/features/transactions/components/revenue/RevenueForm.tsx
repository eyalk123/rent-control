import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { FormScrollView } from '@/src/shared/components/form';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PropertyPicker } from '@/src/features/properties/components/PropertyPicker';
import { RenterPicker } from '@/src/features/renters/components/RenterPicker';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import {
  FormNumericField,
  FormTextField,
  FormWheelDateField,
} from '@/src/shared/components/form';

import type { RevenueFormValues } from '@/src/features/transactions/screens/types';
import { PaymentMethodRadios } from '@/src/features/transactions/components/shared/PaymentMethodRadios';

type RevenueFormProps = {
  control: Control<RevenueFormValues>;
  propertyId: number | null;
  autoFillRevenueForProperty: (propertyId: number | null) => void;
  contentContainerStyle?: ViewStyle;
};

export function RevenueForm({
  control,
  propertyId,
  autoFillRevenueForProperty,
  contentContainerStyle,
}: RevenueFormProps) {
  const { t } = useTranslation();

  return (
    <FormScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
    >
      <FormSectionCard
        title={t('transactions.revenueTitle', { defaultValue: 'Revenue' })}
      >
        <Controller
          control={control}
          name="propertyId"
          render={({ field: { value, onChange } }) => (
            <PropertyPicker
              value={value}
              onChange={(id) => {
                onChange(id);
                autoFillRevenueForProperty(id);
              }}
              label={t('transactions.property', { defaultValue: 'Property' })}
            />
          )}
        />
        <Controller
          control={control}
          name="renterId"
          render={({ field: { value, onChange } }) => (
            <RenterPicker
              propertyId={propertyId}
              value={value}
              onChange={onChange}
              label={t('transactions.renter', { defaultValue: 'Renter' })}
              allowNone
            />
          )}
        />
        <FormNumericField
          control={control}
          name="amount"
          label={t('transactions.amount', { defaultValue: 'Amount' })}
        />
        <FormWheelDateField
          control={control}
          name="monthFor"
          label={t('transactions.monthForLabel', { defaultValue: 'Month' })}
          placeholder={t('transactions.monthForPlaceholder', { defaultValue: 'Month, Year' })}
          mode="monthYear"
        />
        <FormWheelDateField
          control={control}
          name="dateOfPayment"
          label={t('transactions.dateOfPayment', { defaultValue: 'Date of payment' })}
          mode="full"
        />
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field: { value, onChange } }) => (
            <PaymentMethodRadios value={value} onChange={onChange} />
          )}
        />
        <FormTextField
          control={control}
          name="notes"
          label={t('transactions.notes', { defaultValue: 'Notes (optional)' })}
        />
      </FormSectionCard>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
