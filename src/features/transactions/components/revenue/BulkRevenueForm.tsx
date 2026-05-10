import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FormScrollView, FormSectionCard } from '@/src/shared/components/form';
import { spacing } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { usePropertyContext, useRenterContext } from '@/src/context';
import { type PaymentMethod, type Property, type Renter } from '@/src/shared/types';
import { PAYMENT_METHOD_VALUES } from '@/src/shared/constants/paymentMethods';
import { getApiErrorMessage } from '@/src/core/api/client';
import { createRevenueTransaction } from '@/src/features/transactions/api/transactions';
import type { TimePeriodType } from '@/src/features/transactions/screens/types';
import { useRenterSelection } from '@/src/features/transactions/hooks/useRenterSelection';
import { BulkRevenueFilters } from './BulkRevenueFilters';
import { RenterSelectionSection } from './RenterSelectionSection';
import { PaymentDetailsSection } from './PaymentDetailsSection';
import { getDefaultPeriodValue, getMonthsForPeriod } from './periodHelpers';

type PropertyGroup = {
  property: Property;
  renters: Renter[];
};

type BulkRevenueFormProps = {
  onSuccess: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type DateFormValues = { dateOfPayment: string };

export function BulkRevenueForm({ onSuccess, onDirtyChange }: BulkRevenueFormProps) {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { properties } = usePropertyContext();
  const { renters } = useRenterContext();

  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<TimePeriodType>('1month');
  const [periodValue, setPeriodValue] = useState<string>(getDefaultPeriodValue('1month'));
  const [customMonths, setCustomMonths] = useState<Set<string>>(new Set());
  const [gridYear, setGridYear] = useState(new Date().getFullYear());
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');

  const dateForm = useForm<DateFormValues>({
    defaultValues: { dateOfPayment: new Date().toISOString().slice(0, 10) },
  });
  const dateOfPayment = dateForm.watch('dateOfPayment');

  const ownerOptions = useMemo<{ label: string; value: string | null }[]>(() => {
    const owners = Array.from(
      new Set(
        properties
          .map((p) => p.property_owner?.trim())
          .filter((o): o is string => !!o),
      ),
    ).sort();
    return [
      {
        label: t('transactions.bulkRevenue.allOwners', { defaultValue: 'All owners' }),
        value: null,
      },
      ...owners.map((o) => ({ label: o, value: o })),
    ];
  }, [properties, t]);

  const filteredGroups = useMemo<PropertyGroup[]>(() => {
    const filteredProps = ownerFilter
      ? properties.filter((p) => p.property_owner === ownerFilter)
      : properties;
    return filteredProps
      .map((p) => ({
        property: p,
        renters: renters.filter((r) => r.property_id === p.id),
      }))
      .filter((g) => g.renters.length > 0);
  }, [properties, renters, ownerFilter]);

  const allRenters = useMemo(
    () => filteredGroups.flatMap((g) => g.renters),
    [filteredGroups],
  );

  const selection = useRenterSelection({ allRenters, onDirtyChange });

  const firstCheckedRenterId = allRenters.find((r) => selection.checkedIds.has(r.id))?.id ?? null;

  useEffect(() => {
    if (firstCheckedRenterId === null) return;
    const renter = allRenters.find((r) => r.id === firstCheckedRenterId);
    const pt = renter?.payment_type;
    const normalized = pt === 'wire_transfer' ? 'bank_transfer' : pt;
    if (normalized && (PAYMENT_METHOD_VALUES as string[]).includes(normalized)) {
      setPaymentMethod(normalized as PaymentMethod);
    } else {
      setPaymentMethod('cash');
    }
  }, [firstCheckedRenterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChangePeriodType = (type: TimePeriodType) => {
    setPeriodType(type);
    if (type !== 'custom') {
      setPeriodValue(getDefaultPeriodValue(type));
    }
  };

  const handleToggleCustomMonth = (monthStr: string) => {
    setCustomMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthStr)) next.delete(monthStr);
      else next.add(monthStr);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selection.checkedIds.size === 0) {
      appAlert(
        t('validation.title'),
        t('transactions.bulkRevenue.noSelectionError', {
          defaultValue: 'Please select at least one renter.',
        }),
      );
      return;
    }

    const months =
      periodType === 'custom'
        ? [...customMonths].sort()
        : getMonthsForPeriod(periodType, periodValue);

    if (months.length === 0) {
      appAlert(
        t('validation.title'),
        t('transactions.bulkRevenue.noMonthsError', {
          defaultValue: 'Please select at least one month.',
        }),
      );
      return;
    }

    const checkedRenters = allRenters.filter((r) => selection.checkedIds.has(r.id));

    for (const r of checkedRenters) {
      const amt = selection.amounts.get(r.id) ?? '';
      if (!amt || Number.isNaN(Number(amt)) || Number(amt) <= 0) {
        appAlert(
          t('validation.title'),
          t('transactions.bulkRevenue.invalidAmount', {
            name: `${r.first_name} ${r.last_name}`,
            defaultValue: 'Invalid amount for {{name}}.',
          }),
        );
        return;
      }
    }

    setSubmitting(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const r of checkedRenters) {
      const amount = Number(selection.amounts.get(r.id));
      for (const month of months) {
        try {
          await createRevenueTransaction({
            property_id: r.property_id!,
            renter_id: r.id,
            amount,
            date_of_payment: dateOfPayment,
            month_for: month,
            payment_method: paymentMethod || undefined,
          });
          successCount++;
        } catch (err) {
          errors.push(
            getApiErrorMessage(err, `${r.first_name} ${r.last_name} - ${month}`),
          );
        }
      }
    }

    setSubmitting(false);

    if (errors.length > 0) {
      appAlert(
        t('error.title'),
        t('transactions.bulkRevenue.partialError', {
          success: successCount,
          failed: errors.length,
          defaultValue: '{{success}} saved, {{failed}} failed.',
        }),
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSuccess();
    }
  };

  const submitDisabled = submitting || selection.checkedIds.size === 0;

  return (
    <View style={styles.container}>
      <FormScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <FormSectionCard title={t('transactions.revenueTitle', { defaultValue: 'Revenue' })}>
          <BulkRevenueFilters
            ownerOptions={ownerOptions}
            ownerFilter={ownerFilter}
            onOwnerChange={setOwnerFilter}
            periodType={periodType}
            onPeriodTypeChange={handleChangePeriodType}
            periodValue={periodValue}
            onPeriodValueChange={setPeriodValue}
            customMonths={customMonths}
            onToggleCustomMonth={handleToggleCustomMonth}
            gridYear={gridYear}
            onGridYearChange={setGridYear}
          />

          <Divider style={styles.sectionDivider} />

          <RenterSelectionSection
            filteredGroups={filteredGroups}
            allRenters={allRenters}
            checkedIds={selection.checkedIds}
            amounts={selection.amounts}
            allChecked={selection.allChecked}
            someChecked={selection.someChecked}
            onToggleAll={selection.handleToggleAll}
            onToggleRenter={selection.handleToggleRenter}
            onAmountChange={selection.handleAmountChange}
          />

          <Divider style={styles.sectionDivider} />

          <PaymentDetailsSection
            control={dateForm.control}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
          />
        </FormSectionCard>
      </FormScrollView>

      <View
        style={[styles.fixedButtonBar, { paddingBottom: (insets.bottom ?? 0) + spacing.sm }]}
      >
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitDisabled}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
          accessibilityRole="button"
        >
          {t('transactions.save', { defaultValue: 'Save' })}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
  },
  sectionDivider: {
    marginVertical: spacing.lg,
    marginHorizontal: -spacing.lg,
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
