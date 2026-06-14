import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import {
  FormScrollView,
  FormNumericField,
  FormTextField,
  FormWheelDateField,
  FormMonthYearPickerField,
  DropdownField,
} from '@/src/shared/components/form';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import { Controller, type Control, type UseFormSetValue, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { usePropertyContext } from '@/src/context';
import { RenterPicker } from '@/src/features/renters/components/RenterPicker';
import { PaymentMethodRadios } from '@/src/features/transactions/components/shared/PaymentMethodRadios';
import type { RevenueFormValues } from '@/src/features/transactions/screens/types';
import type { PaymentMethod } from '@/src/shared/types';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';

type SingleRevenueFormProps = {
  control: Control<RevenueFormValues>;
  errors?: FieldErrors<RevenueFormValues>;
  propertyId: number | null;
  setValue: UseFormSetValue<RevenueFormValues>;
  contentContainerStyle?: ViewStyle;
};

export function SingleRevenueForm({
  control,
  errors,
  propertyId,
  contentContainerStyle,
}: SingleRevenueFormProps) {
  const { t } = useTranslation();
  const { properties } = usePropertyContext();

  const propertyData = useMemo(
    () =>
      properties.map((p) => ({
        label: `${p.address}${formatFloorApartment(p, t)} - ${p.city}`,
        value: p.id,
      })),
    [properties, t],
  );

  return (
    <FormScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
    >
      <FormSectionCard title={t('transactions.revenueTitle', { defaultValue: 'Revenue' })}>
        <Controller
          control={control}
          name="propertyId"
          render={({ field: { value, onChange } }) => (
            <DropdownField
              data={propertyData}
              value={value}
              onChange={onChange}
              label={t('transactions.property', { defaultValue: 'Property' })}
              error={errors?.propertyId}
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
              label={t('transactions.renterOptional', { defaultValue: 'Renter (optional)' })}
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
            <PaymentMethodRadios value={value as PaymentMethod | ''} onChange={onChange} />
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
