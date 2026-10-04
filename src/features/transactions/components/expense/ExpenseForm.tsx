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
import { useRouter } from 'expo-router';
import { useAccessibleProperties } from '@/src/features/properties/context/PropertyContext';
import { RenterPicker } from '@/src/features/renters/components/RenterPicker';
import { SupplierPicker } from '@/src/features/transactions/components/expense/SupplierPicker';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';

import { ReceiptCard, type ScannedReceipt } from '@/src/features/transactions/components/expense/ReceiptCard';
import { FieldReviewNotice } from '@/src/shared/components/form/FieldReviewContext';
import type { ReceiptFieldNote } from '@/src/features/document-scan/types';
import type { ExpenseFormValues } from '@/src/features/transactions/screens/types';
import type { PaymentMethod, Supplier } from '@/src/shared/types';
import { PaymentMethodField } from '@/src/shared/components/form';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour } from '@/src/features/onboarding/TourController';

/** What a receipt scan left on the form beyond the values themselves. */
export type ExpenseScanNotes = {
  supplierReadAs: string | null;
  categoryNote: ReceiptFieldNote | null;
  propertyNote: ReceiptFieldNote | null;
};

type ExpenseFormProps = {
  control: Control<ExpenseFormValues>;
  errors?: FieldErrors<ExpenseFormValues>;
  propertyIds: number[];
  categoryIds: number[];
  receiptImageUrl: string | null;
  setValue: UseFormSetValue<ExpenseFormValues>;
  ownerId: string;
  /** Editing keeps the plain photo field; the receipt card (and its scan) is for new expenses. */
  isEdit: boolean;
  suppliers: Supplier[];
  reloadSuppliers: () => void;
  scanNotes?: ExpenseScanNotes | null;
  onScanned: (result: ScannedReceipt) => void;
  /** The user changed a field the scan filled with a note shown under it. */
  onNoteResolved: (field: 'category' | 'property') => void;
  contentContainerStyle?: ViewStyle;
};

export function ExpenseForm({
  control,
  errors,
  propertyIds,
  categoryIds,
  receiptImageUrl,
  setValue,
  ownerId,
  isEdit,
  suppliers,
  reloadSuppliers,
  scanNotes,
  onScanned,
  onNoteResolved,
  contentContainerStyle,
}: ExpenseFormProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { properties } = useAccessibleProperties();

  // Requested here rather than from AddTransactionScreen: the screen also renders the
  // revenue forms and the choose step, so it is mounted long before this form is.
  useTour('expense-form');

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
      {!isEdit && (
        <ReceiptCard
          matchProperty={propertyIds.length === 0}
          ownerId={ownerId}
          receiptUrl={receiptImageUrl}
          onReceiptUrl={(url) => setValue('receiptImageUrl', url, { shouldDirty: true })}
          onScanned={onScanned}
        />
      )}
      <FormSectionCard title={t('transactions.details', { defaultValue: 'Details' })}>
        {/* Multi-select, and the expense tour seeds why: several properties split one
            bill evenly between them. */}
        <TourAnchor id={ANCHORS.expensePropertyPicker}>
          <Controller
            control={control}
            name="propertyIds"
            render={({ field: { value, onChange } }) => (
              <MultiSelectField
                data={propertyData}
                value={value}
                onChange={(ids) => {
                  onChange(ids);
                  onNoteResolved('property');
                }}
                label={t('transactions.property', { defaultValue: 'Property' })}
                error={errors?.propertyIds}
                required
              />
            )}
          />
          {scanNotes?.propertyNote && <FieldReviewNotice source={scanNotes.propertyNote.source_text} />}
        </TourAnchor>
        <Controller
          control={control}
          name="renterId"
          render={({ field: { value, onChange } }) => (
            <RenterPicker
              propertyId={renterPropertyId}
              value={renterDisabled ? null : value}
              onChange={onChange}
              label={t('transactions.renter', { defaultValue: 'Renter' })}
              allowNone
              disabled={renterDisabled}
            />
          )}
        />
        <FormNumericField
          control={control}
          name="amount"
          label={t('transactions.amount', { defaultValue: 'Amount' })}
          required
        />
        <FormWheelDateField
          control={control}
          name="dateOfPayment"
          label={t('transactions.dateOfPayment', { defaultValue: 'Date of payment' })}
          mode="full"
          required
        />
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field: { value, onChange } }) => (
            <PaymentMethodField
              value={value as PaymentMethod | ''}
              onChange={onChange}
              error={errors?.paymentMethod}
              required
              reviewName="paymentMethod"
            />
          )}
        />
        <TourAnchor id={ANCHORS.expenseCategoryField}>
          <Controller
            control={control}
            name="categoryIds"
            render={({ field: { value, onChange } }) => (
              <CategoryMultiPickerField
                value={value}
                onChange={(ids) => {
                  // The supplier stays: the two fields are independent, and a supplier
                  // outside the chosen categories is only warned about on save.
                  onChange(ids);
                  onNoteResolved('category');
                }}
                label={t('transactions.category', { defaultValue: 'Category' })}
                error={errors?.categoryIds}
                required
              />
            )}
          />
          {scanNotes?.categoryNote && <FieldReviewNotice source={scanNotes.categoryNote.source_text} />}
        </TourAnchor>
        <Controller
          control={control}
          name="supplierId"
          render={({ field: { value, onChange } }) => (
            <SupplierPicker
              suppliers={suppliers}
              onReload={reloadSuppliers}
              reviewName="supplierId"
              readOnReceipt={scanNotes?.supplierReadAs}
              categoryIds={categoryIds}
              value={value}
              onChange={onChange}
              label={t('transactions.supplier', { defaultValue: 'Supplier' })}
              allowNone
              onAddSupplier={() => router.push('/transactions/add-supplier')}
            />
          )}
        />
        <FormTextField
          control={control}
          name="notes"
          label={t('transactions.notes', { defaultValue: 'Notes' })}
        />
        {isEdit && (
          <FormSingleFileField
            control={control}
            name="receiptImageUrl"
            label={t('transactions.receiptImage', { defaultValue: 'Receipt Photo' })}
            t={t}
            entityType="transactions"
            ownerId={ownerId}
            accept="image"
          />
        )}
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
