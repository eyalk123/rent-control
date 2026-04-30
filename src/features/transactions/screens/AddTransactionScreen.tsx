import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRouter } from 'expo-router';
import { Icon, ScreenContainer } from '@/src/shared/components/ui';
import { useLanguageContext } from '@/src/context';
import { useTransactionContext } from '@/src/features/transactions/context/TransactionContext';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import {
  createExpenseTransaction,
} from '@/src/features/transactions/api/transactions';
import { getApiErrorMessage } from '@/src/core/api/client';
import { type PaymentMethod } from '@/src/shared/types';
import {
  type ExpenseFormValues,
  type TransactionMode,
} from '@/src/features/transactions/screens/types';
import { expenseFormSchema } from '@/src/features/transactions/schemas/expenseFormSchema';
import { TransactionChooseStep } from '@/src/features/transactions/components/shared/TransactionChooseStep';
import { BulkRevenueForm } from '@/src/features/transactions/components/revenue/BulkRevenueForm';
import { ExpenseForm } from '@/src/features/transactions/components/expense/ExpenseForm';

export function AddTransactionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const { refreshTransactions } = useTransactionContext();

  const [mode, setMode] = useState<TransactionMode>('choose');
  const [submitting, setSubmitting] = useState(false);
  const [revenueDirty, setRevenueDirty] = useState(false);
  const allowRemoveRef = React.useRef(false);

  const expenseForm = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema) as Resolver<ExpenseFormValues>,
    defaultValues: {
      propertyIds: [],
      renterId: null,
      amount: '',
      dateOfPayment: new Date().toISOString().slice(0, 10),
      paymentMethod: 'cash',
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
        revenueDirty || expenseForm.formState.isDirty;
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
  }, [navigation, revenueDirty, expenseForm.formState.isDirty, t]);

  const handleRevenueSuccess = () => {
    allowRemoveRef.current = true;
    router.back();
  };

  const submitExpense = expenseForm.handleSubmit(async (values) => {
    const totalAmount = Number(values.amount);
    const perPropertyAmount = Math.round((totalAmount / values.propertyIds.length) * 100) / 100;

    setSubmitting(true);
    try {
      await Promise.all(
        values.propertyIds.map((propertyId: number) =>
          createExpenseTransaction({
            property_id: propertyId,
            renter_id: values.propertyIds.length === 1 ? (values.renterId ?? undefined) : undefined,
            amount: perPropertyAmount,
            date_of_payment: values.dateOfPayment,
            payment_method: values.paymentMethod as PaymentMethod,
            category_id: values.categoryId!,
            supplier_id: values.supplierId ?? undefined,
            notes: values.notes || undefined,
          }),
        ),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refreshTransactions();
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
            <Icon
              name={isRtl ? 'chevron-right' : 'chevron-left'}
              size={24}
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
          <BulkRevenueForm
            onSuccess={handleRevenueSuccess}
            onDirtyChange={setRevenueDirty}
          />
        )}
        {mode === 'expense' && (
          <ExpenseForm
            control={expenseForm.control}
            errors={expenseForm.formState.errors}
            propertyIds={expenseForm.watch('propertyIds')}
            categoryId={expenseForm.watch('categoryId')}
            setValue={expenseForm.setValue}
            contentContainerStyle={formContentPadding}
          />
        )}

        {mode === 'expense' && (
          <View
            style={[
              styles.fixedButtonBar,
              { paddingBottom: insets.bottom + spacing.sm },
            ]}
          >
            <Button
              mode="contained"
              onPress={submitExpense}
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
