import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Checkbox, Divider, Text, useTheme } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  FormScrollView,
  FormSectionCard,
  FormWheelDateField,
} from '@/src/shared/components/form';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { usePropertyContext, useRenterContext } from '@/src/context';
import {
  getRenterMonthlyRent,
  type PaymentMethod,
  type Property,
  type Renter,
} from '@/src/shared/types';
import { getApiErrorMessage } from '@/src/core/api/client';
import { createRevenueTransaction } from '@/src/features/transactions/api/transactions';
import type { TimePeriodType } from '@/src/features/transactions/screens/types';
import { PaymentMethodRadios } from '@/src/features/transactions/components/shared/PaymentMethodRadios';
import { RenterContractCard } from './RenterContractCard';
import { BulkRevenueFilters } from './BulkRevenueFilters';
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
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { properties } = usePropertyContext();
  const { renters } = useRenterContext();

  // Filters
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<TimePeriodType>('1month');
  const [periodValue, setPeriodValue] = useState<string>(getDefaultPeriodValue('1month'));
  const [customMonths, setCustomMonths] = useState<Set<string>>(new Set());
  const [gridYear, setGridYear] = useState(new Date().getFullYear());

  // Selection + amounts
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [amounts, setAmounts] = useState<Map<number, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const dateForm = useForm<DateFormValues>({
    defaultValues: { dateOfPayment: new Date().toISOString().slice(0, 10) },
  });
  const dateOfPayment = dateForm.watch('dateOfPayment');

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

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

  const allChecked = allRenters.length > 0 && allRenters.every((r) => checkedIds.has(r.id));
  const someChecked = !allChecked && allRenters.some((r) => checkedIds.has(r.id));

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleToggleAll = () => {
    if (allChecked) {
      setCheckedIds(new Set());
      onDirtyChange?.(false);
    } else {
      setCheckedIds(new Set<number>(allRenters.map((r) => r.id)));
      setAmounts((prev) => {
        const next = new Map(prev);
        for (const r of allRenters) {
          if (!next.has(r.id)) {
            next.set(r.id, String(getRenterMonthlyRent(r) || ''));
          }
        }
        return next;
      });
      onDirtyChange?.(true);
    }
  };

  const handleToggleRenter = (renter: Renter) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(renter.id)) {
        next.delete(renter.id);
        onDirtyChange?.(next.size > 0);
      } else {
        next.add(renter.id);
        setAmounts((am) => {
          if (am.has(renter.id)) return am;
          const next2 = new Map(am);
          next2.set(renter.id, String(getRenterMonthlyRent(renter) || ''));
          return next2;
        });
        onDirtyChange?.(true);
      }
      return next;
    });
  };

  const handleAmountChange = (renterId: number, value: string) => {
    setAmounts((prev) => new Map(prev).set(renterId, value));
  };

  const handleChangePeriodType = (type: TimePeriodType) => {
    setPeriodType(type);
    if (type !== 'custom') {
      setPeriodValue(getDefaultPeriodValue(type));
    }
  };

  const handleToggleCustomMonth = (monthStr: string) => {
    setCustomMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthStr)) {
        next.delete(monthStr);
      } else {
        next.add(monthStr);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (checkedIds.size === 0) {
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

    const checkedRenters = allRenters.filter((r) => checkedIds.has(r.id));

    for (const r of checkedRenters) {
      const amt = amounts.get(r.id) ?? '';
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
      const amount = Number(amounts.get(r.id));
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const submitDisabled = submitting || checkedIds.size === 0;

  return (
    <View style={styles.container}>
      <FormScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <FormSectionCard
          title={t('transactions.revenueTitle', { defaultValue: 'Revenue' })}
        >
          {/* ── Billing period ── */}
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

          {/* ── Tenants ── */}
          <Text
            variant="labelMedium"
            style={[styles.sectionSubLabel, { color: colors.textSecondary }]}
          >
            {t('transactions.bulkRevenue.tenantsSection', { defaultValue: 'Tenants' })}
          </Text>

          {filteredGroups.length === 0 ? (
            <Text
              variant="bodyMedium"
              style={[styles.emptyText, { color: colors.textSecondary }]}
            >
              {t('transactions.bulkRevenue.noContracts', { defaultValue: 'No contracts found.' })}
            </Text>
          ) : (
            <>
              {allRenters.length > 0 && (
                <View style={styles.selectAllRow}>
                  <Checkbox
                    status={allChecked ? 'checked' : someChecked ? 'indeterminate' : 'unchecked'}
                    onPress={handleToggleAll}
                  />
                  <Text
                    variant="bodyMedium"
                    style={[styles.selectAllLabel, { color: colors.textPrimary }]}
                  >
                    {t('transactions.bulkRevenue.selectAll', { defaultValue: 'Select all' })}
                  </Text>
                  <View style={styles.spacer} />
                  <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                    {t('transactions.bulkRevenue.selectedCount', {
                      count: checkedIds.size,
                      defaultValue: '{{count}} selected',
                    })}
                  </Text>
                </View>
              )}
              {filteredGroups.map((group) => (
                <View key={group.property.id} style={styles.propertyGroup}>
                  <View style={styles.propertyHeaderRow}>
                    <View
                      style={[styles.propertyAccent, { backgroundColor: colors.sectionAccent }]}
                    />
                    <Text
                      variant="titleMedium"
                      style={[styles.propertyHeaderText, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {group.property.address}
                      {group.property.city ? `, ${group.property.city}` : ''}
                    </Text>
                  </View>
                  {group.renters.map((renter) => (
                    <RenterContractCard
                      key={renter.id}
                      renter={renter}
                      checked={checkedIds.has(renter.id)}
                      amount={
                        amounts.get(renter.id) ??
                        String(getRenterMonthlyRent(renter) || '')
                      }
                      onToggle={() => handleToggleRenter(renter)}
                      onAmountChange={(v) => handleAmountChange(renter.id, v)}
                    />
                  ))}
                </View>
              ))}
            </>
          )}

          <Divider style={styles.sectionDivider} />

          {/* ── Payment details ── */}
          <Text
            variant="labelMedium"
            style={[styles.sectionSubLabel, { color: colors.textSecondary }]}
          >
            {t('transactions.bulkRevenue.paymentDetails', { defaultValue: 'Payment details' })}
          </Text>
          <FormWheelDateField
            control={dateForm.control}
            name="dateOfPayment"
            label={t('transactions.dateOfPayment', { defaultValue: 'Date of payment' })}
            mode="full"
          />
          <PaymentMethodRadios
            value={paymentMethod}
            onChange={(v) => setPaymentMethod(v)}
          />
        </FormSectionCard>
      </FormScrollView>

      <View
        style={[
          styles.fixedButtonBar,
          { paddingBottom: (insets.bottom ?? 0) + spacing.sm },
        ]}
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
  sectionSubLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: spacing.md,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  selectAllLabel: {
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  propertyGroup: {
    marginBottom: spacing.lg,
  },
  propertyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm + 2,
  },
  propertyAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  propertyHeaderText: {
    fontWeight: '700',
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: spacing.md,
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
