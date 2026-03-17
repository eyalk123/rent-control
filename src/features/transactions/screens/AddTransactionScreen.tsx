import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation, useRouter } from 'expo-router';
import { ScreenContainer } from '@/src/shared/components/ui';
import { useLanguageContext, useRenterContext } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import {
  createExpenseTransaction,
  createRevenueTransaction,
} from '@/src/features/transactions/api/transactions';
import { getApiErrorMessage } from '@/src/core/api/client';
import { getRenterMonthlyRent, type PaymentMethod } from '@/src/shared/types';
import {
  type ExpenseFormValues,
  type RevenueFormValues,
  type TransactionMode,
} from '@/src/features/transactions/screens/types';
import { TransactionChooseStep } from '@/src/features/transactions/components/TransactionChooseStep';
import { RevenueForm } from '@/src/features/transactions/components/RevenueForm';
import { ExpenseForm } from '@/src/features/transactions/components/ExpenseForm';

export function AddTransactionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { renters } = useRenterContext();

  const [mode, setMode] = useState<TransactionMode>('choose');
  const [submitting, setSubmitting] = useState(false);
  const allowRemoveRef = React.useRef(false);

  const revenueForm = useForm<RevenueFormValues>({
    defaultValues: {
      propertyId: null,
      renterId: null,
      amount: '',
      monthFor: '',
      dateOfPayment: new Date().toISOString().slice(0, 10),
      paymentMethod: '',
      notes: '',
    },
    mode: 'onBlur',
  });

  const expenseForm = useForm<ExpenseFormValues>({
    defaultValues: {
      propertyId: null,
      renterId: null,
      amount: '',
      dateOfPayment: new Date().toISOString().slice(0, 10),
      paymentMethod: '',
      categoryId: null,
      supplierId: null,
      notes: '',
    },
    mode: 'onBlur',
  });

  const handleBack = () => {
    if (mode !== 'choose') {
      setMode('choose');
      return;
    }
    router.back();
  };

  React.useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (allowRemoveRef.current) return;
      const hasUnsavedChanges =
        revenueForm.formState.isDirty || expenseForm.formState.isDirty;
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      Alert.alert(
        t('common.discardChanges'),
        t('common.discardChangesMessage'),
        [
          { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
          {
            text: t('common.discard'),
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsub;
  }, [navigation, revenueForm.formState.isDirty, expenseForm.formState.isDirty, t]);

  const submitRevenue = revenueForm.handleSubmit(async (values) => {
    if (!values.propertyId) {
      Alert.alert(t('validation.title'), t('validation.propertyRequired', { defaultValue: 'Property is required.' }));
      return;
    }
    if (!values.amount || Number.isNaN(Number(values.amount))) {
      Alert.alert(t('validation.title'), t('validation.amountRequired', { defaultValue: 'Valid amount is required.' }));
      return;
    }
    if (!values.monthFor) {
      Alert.alert(t('validation.title'), t('validation.monthForRequired', { defaultValue: 'Month is required.' }));
      return;
    }

    setSubmitting(true);
    try {
      await createRevenueTransaction({
        property_id: values.propertyId,
        renter_id: values.renterId ?? undefined,
        amount: Number(values.amount),
        date_of_payment: values.dateOfPayment,
        month_for: values.monthFor,
        payment_method: values.paymentMethod || undefined,
        notes: values.notes || undefined,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      allowRemoveRef.current = true;
      router.back();
    } catch (err) {
      Alert.alert(
        t('error.title'),
        getApiErrorMessage(err, t('error.saveTransactionFailed', { defaultValue: 'Failed to save transaction' })),
      );
    } finally {
      setSubmitting(false);
    }
  });

  const submitExpense = expenseForm.handleSubmit(async (values) => {
    if (!values.propertyId) {
      Alert.alert(t('validation.title'), t('validation.propertyRequired', { defaultValue: 'Property is required.' }));
      return;
    }
    if (!values.amount || Number.isNaN(Number(values.amount))) {
      Alert.alert(t('validation.title'), t('validation.amountRequired', { defaultValue: 'Valid amount is required.' }));
      return;
    }
    if (!values.dateOfPayment) {
      Alert.alert(
        t('validation.title'),
        t('validation.dateRequired', { defaultValue: 'Date of payment is required.' }),
      );
      return;
    }
    if (!values.paymentMethod) {
      Alert.alert(
        t('validation.title'),
        t('validation.paymentMethodRequired', { defaultValue: 'Payment method is required.' }),
      );
      return;
    }

    setSubmitting(true);
    try {
      await createExpenseTransaction({
        property_id: values.propertyId,
        renter_id: values.renterId ?? undefined,
        amount: Number(values.amount),
        date_of_payment: values.dateOfPayment,
        payment_method: values.paymentMethod as PaymentMethod,
        category_id: values.categoryId ?? 0,
        supplier_id: values.supplierId ?? undefined,
        notes: values.notes || undefined,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      allowRemoveRef.current = true;
      router.back();
    } catch (err) {
      Alert.alert(
        t('error.title'),
        getApiErrorMessage(err, t('error.saveTransactionFailed', { defaultValue: 'Failed to save transaction' })),
      );
    } finally {
      setSubmitting(false);
    }
  });

  const autoFillRevenueForProperty = (propertyId: number | null) => {
    if (!propertyId) {
      revenueForm.setValue('renterId', null);
      return;
    }
    const rentersForProp = renters.filter((r) => r.property_id === propertyId);
    if (rentersForProp.length >= 1) {
      revenueForm.setValue('renterId', rentersForProp[0].id);
      revenueForm.setValue('amount', String(getRenterMonthlyRent(rentersForProp[0]) ?? ''));
    } else {
      revenueForm.setValue('renterId', null);
    }
  };

  const formContentPadding = { paddingBottom: 24 + 48 + spacing.sm + (insets?.bottom ?? 0) };

  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <View
          style={[
            styles.header,
            { flexDirection: isRtl ? 'row-reverse' : 'row' },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={t('common.back')}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={isRtl ? 'chevron-right' : 'chevron-left'}
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        {mode === 'choose' && (
          <TransactionChooseStep
            onSelectRevenue={() => setMode('revenue')}
            onSelectExpense={() => setMode('expense')}
          />
        )}
        {mode === 'revenue' && (
          <RevenueForm
            control={revenueForm.control}
            propertyId={revenueForm.watch('propertyId')}
            autoFillRevenueForProperty={autoFillRevenueForProperty}
            contentContainerStyle={formContentPadding}
          />
        )}
        {mode === 'expense' && (
          <ExpenseForm
            control={expenseForm.control}
            propertyId={expenseForm.watch('propertyId')}
            categoryId={expenseForm.watch('categoryId')}
            setValue={expenseForm.setValue}
            contentContainerStyle={formContentPadding}
          />
        )}

        {mode !== 'choose' && (
          <View
            style={[
              styles.fixedButtonBar,
              { paddingBottom: insets.bottom + spacing.sm },
            ]}
          >
            <Button
              mode="contained"
              onPress={mode === 'revenue' ? submitRevenue : submitExpense}
              loading={submitting}
              disabled={submitting}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
              accessibilityRole="button"
            >
              {t('transactions.save', { defaultValue: 'Save' })}
            </Button>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerSpacer: {
    width: 28,
  },
  fixedButtonBar: {
    paddingTop: spacing.sm,
  },
  saveButton: {
    borderRadius: 12,
  },
  saveButtonContent: {
    minHeight: 48,
  },
});
