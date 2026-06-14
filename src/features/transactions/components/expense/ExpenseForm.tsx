import React, { useMemo } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import {
  FormScrollView,
  MultiSelectField,
  FormNumericField,
  FormTextField,
  FormWheelDateField,
  FormSingleFileField,
  CategoryMultiPickerField,
} from '@/src/shared/components/form';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import { Controller, type Control, type UseFormSetValue, type FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { usePropertyContext } from '@/src/context';
import { RenterPicker } from '@/src/features/renters/components/RenterPicker';
import { SupplierPicker } from '@/src/features/transactions/components/expense/SupplierPicker';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';

import type { ExpenseFormValues } from '@/src/features/transactions/screens/types';
import type { PaymentMethod } from '@/src/shared/types';
import { PaymentMethodRadios } from '@/src/features/transactions/components/shared/PaymentMethodRadios';

type ExpenseFormProps = {
  control: Control<ExpenseFormValues>;
  errors?: FieldErrors<ExpenseFormValues>;
  propertyIds: number[];
  categoryIds: number[];
  setValue: UseFormSetValue<ExpenseFormValues>;
  ownerId: string;
  contentContainerStyle?: ViewStyle;
};

export function ExpenseForm({
  control,
  errors,
  propertyIds,
  categoryIds,
  setValue,
  ownerId,
  contentContainerStyle,
}: ExpenseFormProps) {
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

  const renterPropertyId = propertyIds.length === 1 ? propertyIds[0] : null;
  const renterDisabled = propertyIds.length > 1;

  return (
    <FormScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
    >
      <FormSectionCard
        title={t('transactions.expenseTitle', { defaultValue: 'Expense' })}
      >
        <Controller
          control={control}
          name="propertyIds"
          render={({ field: { value, onChange } }) => (
            <MultiSelectField
              data={propertyData}
              value={value}
              onChange={onChange}
              label={t('transactions.property', { defaultValue: 'Property' })}
              error={errors?.propertyIds}
            />
          )}
        />
        <Controller
          control={control}
          name="renterId"
          render={({ field: { value, onChange } }) => (
            <RenterPicker
              propertyId={renterPropertyId}
              value={renterDisabled ? null : value}
              onChange={onChange}
              label={t('transactions.renterOptional', { defaultValue: 'Renter (optional)' })}
              allowNone
              disabled={renterDisabled}
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
        <Controller
          control={control}
          name="categoryIds"
          render={({ field: { value, onChange } }) => (
            <CategoryMultiPickerField
              value={value}
              onChange={(ids) => {
                onChange(ids);
                setValue('supplierId', null);
              }}
              label={t('transactions.category', { defaultValue: 'Category' })}
              error={errors?.categoryIds}
            />
          )}
        />
        <Controller
          control={control}
          name="supplierId"
          render={({ field: { value, onChange } }) => (
            <SupplierPicker
              categoryIds={categoryIds}
              value={value}
              onChange={onChange}
              label={t('transactions.supplier', { defaultValue: 'Supplier' })}
              allowNone
            />
          )}
        />
        <FormTextField
          control={control}
          name="notes"
          label={t('transactions.notes', { defaultValue: 'Notes (optional)' })}
        />
        <FormSingleFileField
          control={control}
          name="receiptImageUrl"
          label={t('transactions.receiptImage', { defaultValue: 'Receipt Photo' })}
          t={t}
          entityType="transactions"
          ownerId={ownerId}
          accept="image"
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
