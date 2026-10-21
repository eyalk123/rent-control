import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { Control } from 'react-hook-form';
import { Controller, useFormState, useWatch } from 'react-hook-form';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { capabilities } from '@/src/shared/utils/capabilities';
import { Icon, InitialsTile } from '@/src/shared/components/ui';
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
  const name = useWatch({ control, name: 'name' });

  // No card title: the screen header already says Add / Edit property owner.
  return (
    <FormSectionCard>
      {/* Owners have no color of their own - their properties carry it - so the initials sit on the neutral navy tint. */}
      <View style={styles.avatarRow}>
        <InitialsTile name={name ?? ''} size={52} radius={15} backgroundColor={colors.primaryBg} textColor={colors.primary} />
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
      <FormTextField control={control} name="name" label={t('propertyOwners.name')} required />
      <FormTextField control={control} name="phone" label={t('suppliers.phone')} keyboardType="phone-pad" />
      <FormTextField control={control} name="email" label={t('suppliers.email')} keyboardType="email-address" />
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
      {/* Notes last, as on the supplier form. */}
      <FormTextField control={control} name="notes" label={t('suppliers.notes')} />
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
});
