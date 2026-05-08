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
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Icon, ScreenContainer } from '@/src/shared/components/ui';
import { useLanguageContext } from '@/src/context';
import { usePaginatedTransactionContext } from '@/src/features/transactions/context/PaginatedTransactionContext';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import {
  createExpenseTransaction,
  updateRevenueTransaction,
  updateExpenseTransaction,
  getTransactionById,
} from '@/src/features/transactions/api/transactions';
import { getApiErrorMessage } from '@/src/core/api/client';
import { type PaymentMethod } from '@/src/shared/types';
import {
  type ExpenseFormValues,
  type RevenueFormValues,
  type TransactionMode,
} from '@/src/features/transactions/screens/types';
import { expenseFormSchema } from '@/src/features/transactions/schemas/expenseFormSchema';
import { revenueFormSchema } from '@/src/features/transactions/schemas/revenueFormSchema';
import { TransactionChooseStep } from '@/src/features/transactions/components/shared/TransactionChooseStep';
import { BulkRevenueForm } from '@/src/features/transactions/components/revenue/BulkRevenueForm';
import { SingleRevenueForm } from '@/src/features/transactions/components/revenue/SingleRevenueForm';
import { ExpenseForm } from '@/src/features/transactions/components/expense/ExpenseForm';

export function AddTransactionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const { refresh: refreshTransactions } = usePaginatedTransactionContext();

  const [mode, setMode] = useState<TransactionMode>(isEdit ? 'expense' : 'choose');
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

  const revenueForm = useForm<RevenueFormValues>({
    resolver: zodResolver(revenueFormSchema) as Resolver<RevenueFormValues>,
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

  // In edit mode, fetch the transaction and pre-populate the correct form.
  useFocusEffect(
    React.useCallback(() => {
      if (!isEdit || !id) return;
      const numericId = Number(id);
      if (isNaN(numericId)) return;

      getTransactionById(numericId)
        .then((tx) => {
          if (tx.type === 'expense') {
            setMode('expense');
            expenseForm.reset({
              propertyIds: tx.property_id ? [tx.property_id] : [],
              renterId: tx.renter_id,
              amount: String(tx.amount),
              dateOfPayment: tx.date_of_payment,
              paymentMethod: (tx.payment_method as PaymentMethod) ?? 'cash',
              categoryId: tx.category_id,
              supplierId: tx.supplier_id,
              notes: tx.notes ?? '',
            });
          } else {
            setMode('revenue');
            revenueForm.reset({
              propertyId: tx.property_id ?? null,
              renterId: tx.renter_id,
              amount: String(tx.amount),
              monthFor: tx.month_for ? tx.month_for.slice(0, 7) + '-01' : '',
              dateOfPayment: tx.date_of_payment,
              paymentMethod: (tx.payment_method as PaymentMethod) ?? '',
              notes: tx.notes ?? '',
            });
          }
        })
        .catch(() => {
          Alert.alert(t('error.title'), t('error.loadFailed'));
          router.back();
        });
    }, [id, isEdit]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleBack = () => {
    if (!isEdit && mode !== 'choose') {
      setMode('choose');
      return;
    }
    router.back();
  };

  React.useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (allowRemoveRef.current) return;
      const hasUnsavedChanges =
        (!isEdit && revenueDirty) ||
        expenseForm.formState.isDirty ||
        revenueForm.formState.isDirty;
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
  }, [navigation, revenueDirty, expenseForm.formState.isDirty, revenueForm.formState.isDirty, isEdit, t]);

  const handleRevenueSuccess = async () => {
    await refreshTransactions();
    allowRemoveRef.current = true;
    router.back();
  };

  const submitExpense = expenseForm.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateExpenseTransaction(Number(id), {
          property_id: values.propertyIds[0],
          renter_id: values.renterId,
          amount: Number(values.amount),
          date_of_payment: values.dateOfPayment,
          payment_method: values.paymentMethod as PaymentMethod,
          category_id: values.categoryId!,
          supplier_id: values.supplierId,
          notes: values.notes || null,
        });
      } else {
        const totalAmount = Number(values.amount);
        const perPropertyAmount = Math.round((totalAmount / values.propertyIds.length) * 100) / 100;
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
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refreshTransactions();
      allowRemoveRef.current = true;
      router.back();
    } catch (err) {
      Alert.alert(
        t('error.title'),
        getApiErrorMessage(err, t(isEdit ? 'error.updateTransactionFailed' : 'error.saveTransactionFailed')),
      );
    } finally {
      setSubmitting(false);
    }
  });

  const submitRevenue = revenueForm.handleSubmit(async (values) => {
    if (!isEdit || !id) return;
    setSubmitting(true);
    try {
      await updateRevenueTransaction(Number(id), {
        property_id: values.propertyId ?? undefined,
        renter_id: values.renterId,
        amount: Number(values.amount),
        date_of_payment: values.dateOfPayment,
        month_for: values.monthFor,
        payment_method: (values.paymentMethod as PaymentMethod) || null,
        notes: values.notes || null,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refreshTransactions();
      allowRemoveRef.current = true;
      router.back();
    } catch (err) {
      Alert.alert(
        t('error.title'),
        getApiErrorMessage(err, t('error.updateTransactionFailed')),
      );
    } finally {
      setSubmitting(false);
    }
  });

  const saveLabel = isEdit
    ? t('transactions.updateTransaction', { defaultValue: 'Update Transaction' })
    : t('transactions.save', { defaultValue: 'Save' });

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

        {!isEdit && mode === 'choose' && (
          <TransactionChooseStep
            onSelectRevenue={() => setMode('revenue')}
            onSelectExpense={() => setMode('expense')}
          />
        )}
        {!isEdit && mode === 'revenue' && (
          <BulkRevenueForm
            onSuccess={handleRevenueSuccess}
            onDirtyChange={setRevenueDirty}
          />
        )}
        {isEdit && mode === 'revenue' && (
          <SingleRevenueForm
            control={revenueForm.control}
            errors={revenueForm.formState.errors}
            propertyId={revenueForm.watch('propertyId')}
            setValue={revenueForm.setValue}
            contentContainerStyle={formContentPadding}
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
              {saveLabel}
            </Button>
          </View>
        )}

        {isEdit && mode === 'revenue' && (
          <View
            style={[
              styles.fixedButtonBar,
              { paddingBottom: insets.bottom + spacing.sm },
            ]}
          >
            <Button
              mode="contained"
              onPress={submitRevenue}
              loading={submitting}
              disabled={submitting}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
              accessibilityRole="button"
            >
              {saveLabel}
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
