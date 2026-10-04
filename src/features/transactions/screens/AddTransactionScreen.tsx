import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { FormHeader, ScreenContainer } from '@/src/shared/components/ui';
import { usePaginatedTransactionContext } from '@/src/features/transactions/context/PaginatedTransactionContext';
import { spacing } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
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
import { ExpenseForm, type ExpenseScanNotes } from '@/src/features/transactions/components/expense/ExpenseForm';
import type { ScannedReceipt } from '@/src/features/transactions/components/expense/ReceiptCard';
import { useExpenseCategories, useSuppliers } from '@/src/features/transactions/hooks/useTransactions';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';
import { availablePaymentMethods } from '@/src/shared/constants/paymentMethods';
import {
  FieldReviewProvider,
  type FieldReviewEntry,
} from '@/src/shared/components/form/FieldReviewContext';
import { diffProvenance, updateExtractionLog } from '@/src/features/document-scan/api/updateExtractionLog';
import type { ProvenanceItem } from '@/src/features/document-scan/types';

/** Order-free key for a set of ids, so a reordered selection does not count as an edit. */
const idKey = (ids: number[]) => [...ids].sort((a, b) => a - b).join(',');

export function AddTransactionScreen() {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { id, type } = useLocalSearchParams<{ id?: string; type?: string }>();
  const isEdit = Boolean(id);

  const { refresh: refreshTransactions } = usePaginatedTransactionContext();

  const initialMode: TransactionMode = isEdit
    ? 'expense'
    : type === 'revenue' ? 'revenue'
    : type === 'expense' ? 'expense'
    : 'choose';
  const [mode, setMode] = useState<TransactionMode>(initialMode);
  const { user } = useAppAuth();
  const receiptOwnerId = user?.uid ?? '';
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
      // Empty, as on the web: a preset Cash read as the scanner's answer when a receipt
      // scan found no method, and was easy to save unseen without one.
      paymentMethod: '',
      categoryIds: [],
      supplierId: null,
      notes: '',
      receiptImageUrl: null,
    },
    mode: 'onBlur',
  });

  const { suppliers, reload: reloadSuppliers } = useSuppliers();
  const { categories } = useExpenseCategories();

  // ── Receipt scan (new expenses only) ──────────────────────────────────────
  const [scan, setScan] = useState<{
    logId: number;
    /** What the scan filled, to report on save which of it the user changed. */
    provenance: ProvenanceItem[];
    /** Fields the scanner was unsure of, flagged on the form until edited. */
    review: FieldReviewEntry[];
    notes: ExpenseScanNotes;
  } | null>(null);

  /**
   * Pre-fill from a scanned receipt. Only what the scan found is written — a field it left
   * empty keeps whatever the user had — and the property is never replaced once one is
   * chosen, which is also why the scan is only asked to look for one when none is.
   */
  const applyScan = ({ logId, extraction: x }: ScannedReceipt) => {
    const notes = new Map(x.notes.map((n) => [n.field, n]));
    const provenance: ProvenanceItem[] = [];
    const review: FieldReviewEntry[] = [];
    const opts = { shouldDirty: true, shouldValidate: true } as const;
    const track = (formKey: string, labelKey: string, field: string, value: string) => {
      const note = notes.get(field);
      provenance.push({ formKey, labelKey, prefilledValue: value, source: note?.source_text ?? null });
      if (note) review.push({ formKey, source: note.source_text, confidence: note.confidence });
    };

    const property =
      x.property_id != null && expenseForm.getValues('propertyIds').length === 0 ? x.property_id : null;
    if (property != null) {
      expenseForm.setValue('propertyIds', [property], opts);
      track('propertyIds', 'transactions.property', 'property_id', idKey([property]));
    }
    if (x.category_ids.length > 0) {
      expenseForm.setValue('categoryIds', x.category_ids, opts);
      track('categoryIds', 'transactions.category', 'category_ids', idKey(x.category_ids));
    }
    if (x.amount != null) {
      expenseForm.setValue('amount', String(x.amount), opts);
      track('amount', 'transactions.amount', 'amount', String(x.amount));
    }
    if (x.date) {
      expenseForm.setValue('dateOfPayment', x.date, opts);
      track('dateOfPayment', 'transactions.dateOfPayment', 'date', x.date);
    }
    if (x.payment_method && availablePaymentMethods().includes(x.payment_method as PaymentMethod)) {
      expenseForm.setValue('paymentMethod', x.payment_method, opts);
      track('paymentMethod', 'transactions.paymentMethod', 'payment_method', x.payment_method);
    }
    if (x.supplier_id != null) {
      expenseForm.setValue('supplierId', x.supplier_id, opts);
      track('supplierId', 'transactions.supplier', 'supplier_id', String(x.supplier_id));
    }
    setScan({
      logId,
      provenance,
      // Property and category notes are shown under their fields instead (see ExpenseForm).
      review: review.filter((r) => r.formKey !== 'propertyIds' && r.formKey !== 'categoryIds'),
      notes: {
        supplierReadAs: x.supplier_id == null ? x.supplier_name : null,
        categoryNote: x.category_ids.length > 0 ? notes.get('category_ids') ?? null : null,
        propertyNote: property != null ? notes.get('property_id') ?? null : null,
      },
    });
  };

  const resolveScanNote = React.useCallback((field: 'category' | 'property') => {
    const key = field === 'category' ? 'categoryNote' : 'propertyNote';
    setScan((prev) => (prev && prev.notes[key] ? { ...prev, notes: { ...prev.notes, [key]: null } } : prev));
  }, []);

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
              categoryIds: tx.category_ids?.length
                ? tx.category_ids
                : tx.category_id
                  ? [tx.category_id]
                  : [],
              supplierId: tx.supplier_id,
              notes: tx.notes ?? '',
              receiptImageUrl: tx.receipt_image_url ?? null,
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
          appAlert(t('error.title'), t('error.loadFailed'));
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
      appAlert(
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
  }, [navigation, revenueDirty, expenseForm.formState.isDirty, revenueForm.formState.isDirty, isEdit, t, appAlert]);

  const handleRevenueSuccess = async () => {
    await refreshTransactions();
    allowRemoveRef.current = true;
    router.back();
  };

  /**
   * Save with nothing filled in used to do nothing visible: the errors rendered off screen
   * and the view stayed put. Focusing the first invalid field scrolls it in, because the
   * form sits in a KeyboardAwareScrollView. Fields in declaration order, so "first" means
   * first on the page rather than whichever key the resolver happened to report first.
   */
  const focusFirstInvalid = React.useCallback(
    (order: readonly string[], errors: Record<string, unknown>, setFocus: (n: never) => void) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const firstBad = order.find((f) => errors[f]);
      if (firstBad) {
        try {
          setFocus(firstBad as never);
        } catch {
          // Not every control is focusable (dropdowns, pickers); the haptic still fires.
        }
      }
    },
    [],
  );

  const EXPENSE_FIELD_ORDER = [
    'propertyIds',
    'amount',
    'dateOfPayment',
    'paymentMethod',
    'categoryIds',
  ] as const;

  const REVENUE_FIELD_ORDER = [
    'propertyId',
    'amount',
    'monthFor',
    'dateOfPayment',
  ] as const;

  /**
   * A supplier outside the chosen categories is allowed, but asked about first — the same
   * rule as the web form. The server accepts either.
   */
  const submitExpense = expenseForm.handleSubmit(async (values) => {
    const supplier =
      values.supplierId != null ? suppliers.find((s) => s.id === values.supplierId) : undefined;
    if (supplier && !supplier.category_ids?.some((id) => values.categoryIds.includes(id))) {
      const chosen = categories
        .filter((c) => values.categoryIds.includes(c.id))
        .map((c) => getCategoryDisplayName(c, t))
        .join(', ');
      appAlert(
        t('transactions.supplierMismatch.title'),
        t('transactions.supplierMismatch.message', { supplier: supplier.name, categories: chosen }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('transactions.supplierMismatch.saveAnyway'), onPress: () => void saveExpense(values) },
        ],
      );
      return;
    }
    await saveExpense(values);
  }, () =>
    focusFirstInvalid(
      EXPENSE_FIELD_ORDER,
      expenseForm.formState.errors,
      expenseForm.setFocus as (n: never) => void,
    ),
  );

  async function saveExpense(values: ExpenseFormValues) {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateExpenseTransaction(Number(id), {
          property_id: values.propertyIds[0],
          renter_id: values.renterId,
          amount: Number(values.amount),
          date_of_payment: values.dateOfPayment,
          payment_method: values.paymentMethod as PaymentMethod,
          category_ids: values.categoryIds,
          supplier_id: values.supplierId,
          notes: values.notes || null,
          receipt_image_url: values.receiptImageUrl || null,
        });
      } else {
        const totalAmount = Number(values.amount);
        const perPropertyAmount = Math.round((totalAmount / values.propertyIds.length) * 100) / 100;
        const created = await Promise.all(
          values.propertyIds.map((propertyId: number) =>
            createExpenseTransaction({
              property_id: propertyId,
              renter_id: values.propertyIds.length === 1 ? (values.renterId ?? undefined) : undefined,
              amount: perPropertyAmount,
              date_of_payment: values.dateOfPayment,
              payment_method: values.paymentMethod as PaymentMethod,
              category_ids: values.categoryIds,
              supplier_id: values.supplierId ?? undefined,
              notes: values.notes || undefined,
              receipt_image_url: values.receiptImageUrl || null,
            }),
          ),
        );
        if (scan && created[0]) {
          updateExtractionLog(scan.logId, {
            entity_type: 'transaction',
            created_id: created[0].id,
            ...diffProvenance(scan.provenance, {
              ...values,
              propertyIds: idKey(values.propertyIds),
              categoryIds: idKey(values.categoryIds),
            }),
          });
        }
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await refreshTransactions();
      allowRemoveRef.current = true;
      router.back();
    } catch (err) {
      appAlert(
        t('error.title'),
        getApiErrorMessage(err, t(isEdit ? 'error.updateTransactionFailed' : 'error.saveTransactionFailed')),
      );
    } finally {
      setSubmitting(false);
    }
  }

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
      appAlert(
        t('error.title'),
        getApiErrorMessage(err, t('error.updateTransactionFailed')),
      );
    } finally {
      setSubmitting(false);
    }
  }, () =>
    focusFirstInvalid(
      REVENUE_FIELD_ORDER,
      revenueForm.formState.errors,
      revenueForm.setFocus as (n: never) => void,
    ),
  );

  const headerTitle =
    mode === 'expense'
      ? t('transactions.expenseTitle', { defaultValue: 'Expense' })
      : mode === 'revenue'
        ? t('transactions.revenueTitle', { defaultValue: 'Revenue' })
        : t('transactions.addTransaction', { defaultValue: 'Add transaction' });

  const saveLabel = isEdit
    ? t('transactions.updateTransaction', { defaultValue: 'Update Transaction' })
    : t('transactions.save', { defaultValue: 'Save' });

  const formContentPadding = { paddingBottom: 24 + 48 + spacing.sm + (insets?.bottom ?? 0) };

  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        {/* The same header the property and renter forms wear. This screen used to show a
            lone back chevron with its title buried in the first card, and the chooser had no
            header at all. */}
        <View style={styles.headerWrap}>
          <FormHeader title={headerTitle} onBack={handleBack} />
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
          <FieldReviewProvider items={scan?.review}>
            <ExpenseForm
              control={expenseForm.control}
              errors={expenseForm.formState.errors}
              propertyIds={expenseForm.watch('propertyIds')}
              categoryIds={expenseForm.watch('categoryIds')}
              receiptImageUrl={expenseForm.watch('receiptImageUrl') ?? null}
              setValue={expenseForm.setValue}
              ownerId={receiptOwnerId}
              isEdit={isEdit}
              suppliers={suppliers}
              reloadSuppliers={reloadSuppliers}
              scanNotes={scan?.notes}
              onScanned={applyScan}
              onNoteResolved={resolveScanNote}
              contentContainerStyle={formContentPadding}
            />
          </FieldReviewProvider>
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
  headerWrap: {
    marginBottom: spacing.sm,
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
