import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Controller, type Control, type UseFormSetValue } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PropertyPicker } from '@/src/features/properties/components/PropertyPicker';
import { RenterPicker } from '@/src/features/renters/components/RenterPicker';
import { ExpenseCategoryPicker } from '@/src/features/transactions/components/ExpenseCategoryPicker';
import { SupplierPicker } from '@/src/features/transactions/components/SupplierPicker';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import {
  FormNumericField,
  FormTextField,
  FormDatePickerField,
} from '@/src/shared/components/form';
import { spacing } from '@/src/core/theme';
import type { ExpenseFormValues } from '@/src/features/transactions/screens/types';
import { PaymentMethodRadios } from '@/src/features/transactions/components/PaymentMethodRadios';

type ExpenseFormProps = {
  control: Control<ExpenseFormValues>;
  propertyId: number | null;
  categoryId: number | null;
  setValue: UseFormSetValue<ExpenseFormValues>;
  contentContainerStyle?: ViewStyle;
};

export function ExpenseForm({
  control,
  propertyId,
  categoryId,
  setValue,
  contentContainerStyle,
}: ExpenseFormProps) {
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
        title={t('transactions.expenseTitle', { defaultValue: 'Expense' })}
      >
        <Controller
          control={control}
          name="propertyId"
          render={({ field: { value, onChange } }) => (
            <PropertyPicker
              value={value}
              onChange={onChange}
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
        <Controller
          control={control}
          name="categoryId"
          render={({ field: { value, onChange } }) => (
            <ExpenseCategoryPicker
              value={value}
              onChange={(id) => {
                onChange(id);
                setValue('supplierId', null);
              }}
              label={t('transactions.category', { defaultValue: 'Category' })}
            />
          )}
        />
        <Controller
          control={control}
          name="supplierId"
          render={({ field: { value, onChange } }) => (
            <SupplierPicker
              categoryId={categoryId}
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
