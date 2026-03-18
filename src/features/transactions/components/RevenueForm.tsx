import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PropertyPicker } from '@/src/features/properties/components/PropertyPicker';
import { RenterPicker } from '@/src/features/renters/components/RenterPicker';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import {
  FormNumericField,
  FormTextField,
  FormDatePickerField,
  FormMonthYearPickerField,
} from '@/src/shared/components/form';
import { spacing } from '@/src/core/theme';
import type { RevenueFormValues } from '@/src/features/transactions/screens/types';
import { PaymentMethodRadios } from '@/src/features/transactions/components/PaymentMethodRadios';

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
    <KeyboardAwareScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={spacing.keyboardExtraScrollHeight}
      bounces={false}
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
        <FormMonthYearPickerField
          control={control}
          name="monthFor"
          label={t('transactions.monthForLabel', { defaultValue: 'Month' })}
          placeholder={t('transactions.monthForPlaceholder', { defaultValue: 'Month, Year' })}
        />
        <FormDatePickerField
          control={control}
          name="dateOfPayment"
          label={t('transactions.dateOfPayment', { defaultValue: 'Date of payment' })}
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
    </KeyboardAwareScrollView>
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
