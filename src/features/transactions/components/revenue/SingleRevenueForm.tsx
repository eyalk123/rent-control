import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import {
  AmountHeroField,
  FormRow,
  FormScrollView,
  FormTextField,
  FormWheelDateField,
  FormMonthYearPickerField,
  DropdownField,
} from '@/src/shared/components/form';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import { Controller, type Control, type UseFormSetValue, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAccessibleProperties } from '@/src/features/properties/context/PropertyContext';
import { RenterPicker } from '@/src/features/renters/components/RenterPicker';
import { PaymentMethodField } from '@/src/shared/components/form';
import type { RevenueFormValues } from '@/src/features/transactions/screens/types';
import type { PaymentMethod } from '@/src/shared/types';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import { useTheme } from 'react-native-paper';
import { darkColors, lightColors } from '@/src/core/theme';
import { PropertyThumb } from '@/src/features/properties/components/PropertyThumb';

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
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { properties } = useAccessibleProperties();
  const selectedProperty = properties.find((p) => p.id === propertyId);

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
      {/* Laid out like the expense form: no "Details" title, the amount first and large
          under a "Money in" chip, then where it came from, then when. */}
      <FormSectionCard>
        <AmountHeroField
          control={control}
          name="amount"
          label={t('transactions.amount', { defaultValue: 'Amount' })}
          required
          tone={{ text: t('transactions.moneyIn'), bg: colors.revBg, fg: colors.revFg }}
        />
        <Controller
          control={control}
          name="propertyId"
          render={({ field: { value, onChange } }) => (
            <DropdownField
              searchable
              data={propertyData}
              value={value}
              onChange={onChange}
              label={t('transactions.property', { defaultValue: 'Property' })}
              error={errors?.propertyId}
              required
              leading={
                selectedProperty ? (
                  <PropertyThumb property={selectedProperty} width={52} height={36} radius={6} iconSize={18} />
                ) : undefined
              }
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
        {/* The month it pays for and the day it was paid: two dates, one row. */}
        <FormRow>
          <FormMonthYearPickerField
            control={control}
            name="monthFor"
            label={t('transactions.monthForLabel', { defaultValue: 'Month' })}
            required
            placeholder={t('transactions.monthForPlaceholder', { defaultValue: 'Month, Year' })}
          />
          <FormWheelDateField
            control={control}
            name="dateOfPayment"
            label={t('transactions.dateOfPayment', { defaultValue: 'Date of payment' })}
            required
            mode="full"
          />
        </FormRow>
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field: { value, onChange } }) => (
            <PaymentMethodField value={value as PaymentMethod | ''} onChange={onChange} />
          )}
        />
        <FormTextField
          control={control}
          name="notes"
          label={t('transactions.notes', { defaultValue: 'Notes' })}
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
