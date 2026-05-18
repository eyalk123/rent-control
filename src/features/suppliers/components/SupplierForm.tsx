import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller, useFormState } from 'react-hook-form';
import { Text, useTheme } from 'react-native-paper';
import { Icon } from '@/src/shared/components/ui';
import { useTranslation } from 'react-i18next';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import { FormTextField } from '@/src/shared/components/form/FormFields';
import { CategoryTagPicker } from '@/src/features/transactions/components/expense/CategoryTagPicker';
import BankAccountInput from '@/src/shared/components/form/BankAccountInput';
import type { SupplierFormValues } from '@/src/features/suppliers/validation/supplierValidation';
import { lightColors, darkColors, spacing } from '@/src/core/theme';

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

  return (
    <FormSectionCard
      title={t('suppliers.details', { defaultValue: 'Supplier details' })}
    >
      {!isEdit && onPickFromContacts && Platform.OS !== 'web' && (
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: colors.inputBackground }]}
          onPress={onPickFromContacts}
          activeOpacity={0.7}
        >
          <View style={styles.contactIcon}>
            <Icon
              name="users"
              size={22}
              color={colors.primary}
            />
          </View>
          <Text variant="bodyMedium" style={{ color: colors.primary }}>
            {t('suppliers.chooseFromContacts', {
              defaultValue: 'Choose from contacts',
            })}
          </Text>
        </TouchableOpacity>
      )}
      <FormTextField
        control={control}
        name="name"
        label={`${t('suppliers.name', { defaultValue: 'Name' })} *`}
      />
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
      <FormTextField
        control={control}
        name="notes"
        label={t('suppliers.notes', { defaultValue: 'Notes (optional)' })}
      />
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
      <Controller
        control={control}
        name="categoryIds"
        render={({ field: { value, onChange } }) => (
          <CategoryTagPicker
            value={value}
            onChange={onChange}
            label={`${t('suppliers.categories', { defaultValue: 'Categories' })} *`}
          />
        )}
      />
    </FormSectionCard>
  );
}

const styles = StyleSheet.create({
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  contactIcon: {
    marginEnd: spacing.sm,
  },
});
