import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller, useFormState } from 'react-hook-form';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { capabilities } from '@/src/shared/utils/capabilities';
import { Icon } from '@/src/shared/components/ui';
import { FormSectionCard } from '@/src/shared/components/form/FormSectionCard';
import { FormTextField } from '@/src/shared/components/form/FormFields';
import BankAccountInput from '@/src/shared/components/form/BankAccountInput';
import type { PropertyOwnerFormValues } from '@/src/features/property-owners/validation/propertyOwnerValidation';
import { lightColors, darkColors, spacing } from '@/src/core/theme';

type PropertyOwnerFormProps = {
  control: Control<PropertyOwnerFormValues>;
  isEdit?: boolean;
  onPickFromContacts?: () => void;
};

/** The supplier form without categories: name, contact details, notes and the bank account. */
export function PropertyOwnerForm({ control, isEdit = false, onPickFromContacts }: PropertyOwnerFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { errors, isSubmitting } = useFormState({ control });

  return (
    <FormSectionCard title={t('propertyOwners.details')}>
      {!isEdit && onPickFromContacts && Platform.OS !== 'web' && (
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: colors.inputBackground }]}
          onPress={onPickFromContacts}
          activeOpacity={0.7}
        >
          <View style={styles.contactIcon}>
            <Icon name="users" size={22} color={colors.primary} />
          </View>
          <Text variant="bodyMedium" style={{ color: colors.primary }}>
            {t('suppliers.chooseFromContacts')}
          </Text>
        </TouchableOpacity>
      )}
      <FormTextField control={control} name="name" label={`${t('propertyOwners.name')} *`} />
      <FormTextField control={control} name="phone" label={t('suppliers.phone')} keyboardType="phone-pad" />
      <FormTextField control={control} name="email" label={t('suppliers.email')} keyboardType="email-address" />
      <FormTextField control={control} name="notes" label={t('suppliers.notes')} />
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
        <FormTextField
          control={control}
          name="paymentDetails"
          label={t('suppliers.paymentDetails')}
          placeholder={t('suppliers.paymentDetailsPlaceholder')}
        />
      )}
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
