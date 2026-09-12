import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Divider } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FormScrollView, FormSectionCard } from '@/src/shared/components/form';
import { spacing } from '@/src/core/theme';
import { useAlert, useLanguageContext } from '@/src/core/context';
import { sortLabels } from '@/src/shared/utils/sortOptions';
import { formatMoney } from '@/src/shared/utils/money';
import { usePropertyContext, useRenterContext } from '@/src/context';
import {
  type PaymentMethod,
  type Property,
  type Renter,
  getRentForMonth,
  isNonMonthlyCadence,
  paymentFrequencyLabel,
} from '@/src/shared/types';
import {
  dueMonthsWithin,
  paymentIntervalMonths,
} from '@/src/features/transactions/utils/rentSchedule';
import { PAYMENT_METHOD_VALUES } from '@/src/shared/constants/paymentMethods';
import { getApiErrorMessage } from '@/src/core/api/client';
import { createRevenueTransaction } from '@/src/features/transactions/api/transactions';
import type { TimePeriodType } from '@/src/features/transactions/screens/types';
import { useRenterSelection } from '@/src/features/transactions/hooks/useRenterSelection';
import { BulkRevenueOwnerFilter, BulkRevenuePeriodFilter } from './BulkRevenueFilters';
import { RenterSelectionSection } from './RenterSelectionSection';
import { PaymentDetailsSection } from './PaymentDetailsSection';
import { getContractYearMonths, getDefaultPeriodValue, getMonthsForPeriod } from './periodHelpers';
import { useTour } from '@/src/features/onboarding/TourController';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { ANCHORS } from '@/src/features/onboarding/anchors';

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
  const { language } = useLanguageContext();

  // The bulk form is where the scope and per-contract anchors live, so it asks. Arriving
  // from the `bulk-rent` seed adds the callback line on the first step.
  useTour('revenue-form');

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

  // This filter renders a raw Dropdown rather than DropdownField, so it sorts its own owners.
  const ownerOptions = useMemo<{ label: string; value: string | null }[]>(() => {
    const owners = sortLabels(
      Array.from(
        new Set(
          properties
            .map((p) => p.property_owner?.trim())
            .filter((o): o is string => !!o),
        ),
      ),
      language,
    );
    return [
      {
        label: t('transactions.bulkRevenue.allOwners', { defaultValue: 'All owners' }),
        value: null,
      },
      ...owners.map((o) => ({ label: o, value: o })),
    ];
  }, [properties, t, language]);

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

  /**
   * The months the chosen period covers for one renter, before cadence is applied.
   * Shared by the submit path and the per-renter note so the two cannot drift apart.
   */
  const periodMonthsFor = (r: Renter): string[] =>
    periodType === 'year'
      ? getContractYearMonths(Number(periodValue), r.lease_start)
      : periodType === 'custom'
        ? [...customMonths].sort()
        : getMonthsForPeriod(periodType, periodValue);

  /** One line saying what this period will actually write for a non-monthly lease. */
  const cadenceNoteFor = (r: Renter): string | null => {
    if (!isNonMonthlyCadence(r.number_of_payments)) return null;
    const cadence = paymentFrequencyLabel(r.number_of_payments);
    if (!cadence) return null;
    const label = t(cadence.key, { count: cadence.count });
    const due = dueMonthsWithin(r, periodMonthsFor(r));
    if (due.length === 0) {
      return t('transactions.bulkRevenue.nothingDue', {
        cadence: label,
        defaultValue: '{{cadence}}: nothing due in this period',
      });
    }
    const instalment = getRentForMonth(r, due[0]) * paymentIntervalMonths(r.number_of_payments);
    return t('transactions.bulkRevenue.instalmentsNote', {
      cadence: label,
      count: due.length,
      amount: formatMoney(instalment),
      defaultValue: '{{cadence}}, {{count}} x {{amount}}',
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

    // For 'year', months are computed per-renter from their lease_start; validate via custom months for other types.
    if (periodType === 'custom' && customMonths.size === 0) {
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
      if (selection.overriddenIds.has(r.id)) {
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
    }

    setSubmitting(true);
    let successCount = 0;
    const errors: string[] = [];

    let skippedNothingDue = 0;

    for (const r of checkedRenters) {
      const allMonths = periodMonthsFor(r);
      // A quarterly lease picked out of a three-month period owes once, not three times, and
      // it owes the whole instalment when it does. Writing three monthly rows instead put the
      // payment grid and the overdue engine permanently at odds with this form: both key off
      // the instalment landing on the cycle month, so every quarter came back flagged as paid
      // short. The per-renter note in the list says what this will write.
      const months = dueMonthsWithin(r, allMonths);
      const interval = paymentIntervalMonths(r.number_of_payments);
      if (months.length === 0) {
        skippedNothingDue++;
        continue;
      }

      const storedAmount = Number(selection.amounts.get(r.id));
      const isManualOverride = selection.overriddenIds.has(r.id);
      for (const month of months) {
        // An override is used exactly as typed — it is what the landlord says they actually
        // received, so it is already the instalment and multiplying it would double-count.
        const amount = isManualOverride ? storedAmount : getRentForMonth(r, month) * interval;
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

    // A renter the cadence had nothing for is named rather than dropped in silence: they were
    // checked, so an unexplained lower count reads as a save that went wrong.
    const skippedNote =
      skippedNothingDue > 0
        ? ' ' +
          t('transactions.bulkRevenue.skippedNothingDue', {
            count: skippedNothingDue,
            defaultValue: 'Skipped {{count}} with nothing due in this period',
          })
        : '';

    if (errors.length > 0) {
      appAlert(
        t('error.title'),
        t('transactions.bulkRevenue.partialError', {
          success: successCount,
          failed: errors.length,
          defaultValue: '{{success}} saved, {{failed}} failed.',
        }) + skippedNote,
      );
    } else if (successCount === 0 && skippedNothingDue > 0) {
      appAlert(t('validation.title'), skippedNote.trim());
    } else {
      if (skippedNote) appAlert(t('common.done', { defaultValue: 'Done' }), skippedNote.trim());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSuccess();
    }
  };

  const submitDisabled = submitting || selection.checkedIds.size === 0;

  return (
    <View style={styles.container}>
      <FormScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <FormSectionCard title={t('transactions.details', { defaultValue: 'Details' })}>
          <BulkRevenueOwnerFilter
            ownerOptions={ownerOptions}
            ownerFilter={ownerFilter}
            onOwnerChange={setOwnerFilter}
          />

          <Divider style={styles.sectionDivider} />

          <RenterSelectionSection
            filteredGroups={filteredGroups}
            allRenters={allRenters}
            checkedIds={selection.checkedIds}
            amounts={selection.amounts}
            overriddenIds={selection.overriddenIds}
            allChecked={selection.allChecked}
            someChecked={selection.someChecked}
            onToggleAll={selection.handleToggleAll}
            onToggleRenter={selection.handleToggleRenter}
            onAmountChange={selection.handleAmountChange}
            onToggleOverride={selection.handleToggleOverride}
            cadenceNoteFor={cadenceNoteFor}
          />

          <Divider style={styles.sectionDivider} />

          <TourAnchor id={ANCHORS.revenuePeriodPicker}>
          <BulkRevenuePeriodFilter
            periodType={periodType}
            onPeriodTypeChange={handleChangePeriodType}
            periodValue={periodValue}
            onPeriodValueChange={setPeriodValue}
            customMonths={customMonths}
            onToggleCustomMonth={handleToggleCustomMonth}
            gridYear={gridYear}
            onGridYearChange={setGridYear}
          />
          </TourAnchor>

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
