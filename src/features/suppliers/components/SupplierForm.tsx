import React from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import { FormTextField } from '@/src/shared/components/form/FormFields';
import { CategoryTagPicker } from '@/src/features/transactions/components/CategoryTagPicker';
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
          <MaterialCommunityIcons
            name="account-multiple"
            size={22}
            color={colors.primary}
            style={styles.contactIcon}
          />
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
        name="categoryIds"
        render={({ field: { value, onChange }, fieldState: { error } }) => (
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
