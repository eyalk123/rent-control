import React from 'react';
import { capabilities } from '@/src/shared/utils/capabilities';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller, useFormState, useWatch } from 'react-hook-form';
import { Text, useTheme } from 'react-native-paper';
import { Icon, InitialsTile } from '@/src/shared/components/ui';
import { useExpenseCategories } from '@/src/features/transactions/hooks/useTransactions';
import { supplierColorKey } from '@/src/features/suppliers/utils/supplierColor';
import { useTranslation } from 'react-i18next';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import { FormTextField } from '@/src/shared/components/form/FormFields';
import { CategoryMultiPickerField } from '@/src/shared/components/form';
import BankAccountInput from '@/src/shared/components/form/BankAccountInput';
import type { SupplierFormValues } from '@/src/features/suppliers/validation/supplierValidation';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { lightColors, darkColors, spacing, useEntityColor } from '@/src/core/theme';

type SupplierFormProps = {
  control: Control<SupplierFormValues>;
  isEdit?: boolean;
  onPickFromContacts?: () => void;
};

export function SupplierForm({
  control,
  isEdit = false,
  onPickFromContacts,
}: SupplierFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { errors, isSubmitting } = useFormState({ control });
  const name = useWatch({ control, name: 'name' });
  const categoryIds = useWatch({ control, name: 'categoryIds' });
  const { categories } = useExpenseCategories();
  const itemColor = useEntityColor(supplierColorKey({ category_ids: categoryIds }, categories));

  // No card title: the screen header already says Add / Edit supplier.
  return (
    <FormSectionCard>
      {/* Initials on the supplier's color - its first category's - as the list will show it. */}
      <View style={styles.avatarRow}>
        <InitialsTile name={name ?? ''} size={52} radius={15} backgroundColor={itemColor.bg} textColor={itemColor.fg} />
        {!isEdit && onPickFromContacts && Platform.OS !== 'web' && (
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primaryBg }]}
            onPress={onPickFromContacts}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Icon name="users" size={18} color={colors.primary} />
            <Text variant="bodyMedium" style={[styles.contactLabel, { color: colors.primary }]} numberOfLines={1}>
              {t('suppliers.chooseFromContacts', { defaultValue: 'Choose from contacts' })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <TourAnchor id={ANCHORS.supplierFormName}>
        <FormTextField
          control={control}
          name="name"
          label={t('suppliers.name', { defaultValue: 'Name' })}
          required
        />
      </TourAnchor>
      {/* Categories right after the name: they say what the supplier does, and the first
          one gives it its color. */}
      <TourAnchor id={ANCHORS.supplierFormCategories}>
        <Controller
          control={control}
          name="categoryIds"
          render={({ field: { value, onChange } }) => (
            <CategoryMultiPickerField
              value={value}
              onChange={onChange}
              label={t('suppliers.categories', { defaultValue: 'Categories' })}
              required
            />
          )}
        />
        <Text variant="bodySmall" style={[styles.helper, { color: colors.textSecondary }]}>
          {t('suppliers.colorFromCategory')}
        </Text>
      </TourAnchor>
      <FormTextField
        control={control}
        name="phone"
        label={t('suppliers.phone', { defaultValue: 'Phone (optional)' })}
        keyboardType="phone-pad"
      />
      <FormTextField
        control={control}
        name="email"
        label={t('suppliers.email', { defaultValue: 'Email (optional)' })}
        keyboardType="email-address"
      />
      <TourAnchor id={ANCHORS.supplierFormBank}>
        {capabilities().structuredBankDetails ? (
          <Controller
            control={control}
            name="bankAccount"
            render={({ field: { value, onChange } }) => (
              <BankAccountInput
                value={value ?? { bank: '', branch: '', account: '' }}
                onChange={onChange}
                editable={!isSubmitting}
                error={errors.bankAccount?.message as string | undefined}
              />
            )}
          />
        ) : (
          /* Bank + branch + account picked from a list is an Israeli banking shape. No
             IBAN, routing-number or sort-code validation: a rule that rejects a valid
             account is worse than no rule. */
          <FormTextField
            control={control}
            name="paymentDetails"
            label={t('suppliers.paymentDetails', { defaultValue: 'Payment details' })}
            placeholder={t('suppliers.paymentDetailsPlaceholder', {
              defaultValue: 'Account or transfer details',
            })}
          />
        )}
      </TourAnchor>
      <FormTextField
        control={control}
        name="notes"
        label={t('suppliers.notes', { defaultValue: 'Notes (optional)' })}
      />
    </FormSectionCard>
  );
}

const styles = StyleSheet.create({
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  contactButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  contactLabel: {
    flexShrink: 1,
    fontWeight: '500',
  },
  helper: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
});
