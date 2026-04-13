import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Control } from 'react-hook-form';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import { FormWheelDateField } from '@/src/shared/components/form';
import type { PaymentMethod } from '@/src/shared/types';
import { formatDateDisplay } from './periodHelpers';

type DateFormValues = { dateOfPayment: string };

type BulkRevenuePaymentSectionProps = {
  dateControl: Control<DateFormValues>;
  dateOfPayment: string;
  paymentMethod: PaymentMethod | '';
  onPaymentMethodChange: (value: PaymentMethod | '') => void;
  paymentOpen: boolean;
  onTogglePayment: () => void;
  submitting: boolean;
  submitDisabled: boolean;
  onSubmit: () => void;
};

export function BulkRevenuePaymentSection({
  dateControl,
  dateOfPayment,
  paymentMethod,
  onPaymentMethodChange,
  paymentOpen,
  onTogglePayment,
  submitting,
  submitDisabled,
  onSubmit,
}: BulkRevenuePaymentSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const insets = useSafeAreaInsets();

  const paymentMethodLabel = useMemo(() => {
    const labels: Record<string, string> = {
      bit: t('transactions.paymentMethodBit', { defaultValue: 'Bit' }),
      cash: t('transactions.paymentMethodCash', { defaultValue: 'Cash' }),
      bank_transfer: t('transactions.paymentMethodBankTransfer', { defaultValue: 'Bank transfer' }),
    };
    return paymentMethod ? labels[paymentMethod] : '—';
  }, [paymentMethod, t]);

  return (
    <View
      style={[
        styles.bottomArea,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.outline,
          paddingBottom: (insets.bottom ?? 0) + spacing.sm,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.paymentHeader}
        onPress={onTogglePayment}
        activeOpacity={0.7}
      >
        <View style={styles.paymentHeaderText}>
          <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
            {t('transactions.bulkRevenue.paymentDetails', { defaultValue: 'Payment details' })}
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.textPrimary }}>
            {formatDateDisplay(dateOfPayment, locale)}
            {paymentMethod ? `  ·  ${paymentMethodLabel}` : ''}
          </Text>
        </View>
        <MaterialCommunityIcons
          name={paymentOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {paymentOpen && (
        <View style={styles.paymentBody}>
          <FormWheelDateField
            control={dateControl}
            name="dateOfPayment"
            label={t('transactions.dateOfPayment', { defaultValue: 'Date of payment' })}
            mode="full"
          />
          <SegmentedButtons
            value={paymentMethod}
            onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod | '')}
            buttons={[
              {
                value: 'bit',
                label: t('transactions.paymentMethodBit', { defaultValue: 'Bit' }),
              },
              {
                value: 'cash',
                label: t('transactions.paymentMethodCash', { defaultValue: 'Cash' }),
              },
              {
                value: 'bank_transfer',
                label: t('transactions.paymentMethodBankTransfer', {
                  defaultValue: 'Transfer',
                }),
              },
            ]}
            style={styles.paymentMethodSegmented}
          />
        </View>
      )}

      <Button
        mode="contained"
        onPress={onSubmit}
        loading={submitting}
        disabled={submitDisabled}
        style={styles.saveButton}
        contentStyle={styles.saveButtonContent}
        accessibilityRole="button"
      >
        {t('transactions.save', { defaultValue: 'Save' })}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomArea: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  paymentHeaderText: {
    flex: 1,
    gap: 2,
  },
  paymentBody: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  paymentMethodSegmented: {
    marginBottom: spacing.xs,
  },
  saveButton: {
    borderRadius: 12,
    marginTop: spacing.xs,
  },
  saveButtonContent: {
    minHeight: 48,
  },
});
