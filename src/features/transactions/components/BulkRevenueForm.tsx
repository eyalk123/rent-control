import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Checkbox, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Dropdown } from 'react-native-element-dropdown';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext, useRtlInputStyle, useRtlLabelStyle } from '@/src/context';
import { usePropertyContext, useRenterContext } from '@/src/context';
import {
  getRenterMonthlyRent,
  type PaymentMethod,
  type Property,
  type Renter,
} from '@/src/shared/types';
import { FormWheelDateField } from '@/src/shared/components/form';
import { getApiErrorMessage } from '@/src/core/api/client';
import { createRevenueTransaction } from '@/src/features/transactions/api/transactions';
import type { TimePeriodType } from '@/src/features/transactions/screens/types';
import { RenterContractCard } from './RenterContractCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PropertyGroup = {
  property: Property;
  renters: Renter[];
};

type BulkRevenueFormProps = {
  onSuccess: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

type DateFormValues = { dateOfPayment: string };

// ---------------------------------------------------------------------------
// Period helpers
// ---------------------------------------------------------------------------

function getDefaultPeriodValue(type: Exclude<TimePeriodType, 'custom'>): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (type === '1month') {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  }
  if (type === 'quarter') {
    const currentQ = Math.ceil(month / 3);
    const prevQ = currentQ === 1 ? 4 : currentQ - 1;
    const prevQYear = currentQ === 1 ? year - 1 : year;
    return `${prevQYear}-Q${prevQ}`;
  }
  return String(year - 1);
}

/** Returns an array of 'YYYY-MM-01' strings for the given period. */
function getMonthsForPeriod(type: Exclude<TimePeriodType, 'custom'>, value: string): string[] {
  if (type === '1month') {
    const [y, m] = value.split('-');
    return [`${y}-${m}-01`];
  }
  if (type === 'quarter') {
    const [yearStr, qPart] = value.split('-');
    const qYear = Number(yearStr);
    const qNum = Number(qPart.replace('Q', ''));
    const startMonth = (qNum - 1) * 3 + 1;
    return [0, 1, 2].map((i) => {
      const m = startMonth + i;
      return `${qYear}-${String(m).padStart(2, '0')}-01`;
    });
  }
  const y = Number(value);
  return Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}-01`);
}

function generatePeriodOptions(
  type: Exclude<TimePeriodType, 'custom'>,
  locale: string,
): { label: string; value: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (type === '1month') {
    const items: { label: string; value: string }[] = [];
    for (let i = 2; i >= -11; i--) {
      let m = month + i;
      let y = year;
      while (m <= 0) { m += 12; y--; }
      while (m > 12) { m -= 12; y++; }
      const value = `${y}-${String(m).padStart(2, '0')}`;
      const label = new Date(y, m - 1, 1).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      });
      items.push({ label, value });
    }
    return items;
  }

  if (type === 'quarter') {
    const items: { label: string; value: string }[] = [];
    let curQ = Math.ceil(month / 3);
    let curY = year;
    for (let i = 0; i < 8; i++) {
      items.push({ label: `Q${curQ} ${curY}`, value: `${curY}-Q${curQ}` });
      curQ--;
      if (curQ === 0) { curQ = 4; curY--; }
    }
    return items;
  }

  return [year, year - 1, year - 2, year - 3].map((y) => ({
    label: String(y),
    value: String(y),
  }));
}

function formatDateDisplay(value: string, locale: string): string {
  const parts = value.split('-').map(Number);
  if (parts.length < 3 || parts.some(Number.isNaN)) return value;
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// MonthGridPicker
// ---------------------------------------------------------------------------

type MonthGridPickerProps = {
  gridYear: number;
  onYearChange: (year: number) => void;
  selectedMonths: Set<string>;
  onToggle: (monthStr: string) => void;
  locale: string;
  colors: typeof lightColors | typeof darkColors;
  totalSelected: number;
  t: ReturnType<typeof useTranslation>['t'];
};

function MonthGridPicker({
  gridYear,
  onYearChange,
  selectedMonths,
  onToggle,
  locale,
  colors,
  totalSelected,
  t,
}: MonthGridPickerProps) {
  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(locale, { month: 'short' }),
  );

  return (
    <View style={gridStyles.container}>
      <View style={gridStyles.yearRow}>
        <TouchableOpacity
          onPress={() => onYearChange(gridYear - 1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text variant="titleSmall" style={{ color: colors.textPrimary }}>
          {gridYear}
        </Text>
        <TouchableOpacity
          onPress={() => onYearChange(gridYear + 1)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={gridStyles.grid}>
        {monthNames.map((name, i) => {
          const monthStr = `${gridYear}-${String(i + 1).padStart(2, '0')}-01`;
          const selected = selectedMonths.has(monthStr);
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onToggle(monthStr)}
              style={[
                gridStyles.chip,
                {
                  backgroundColor: selected ? colors.primary : colors.inputFilledBackground,
                  borderColor: selected ? colors.primary : colors.outline,
                },
              ]}
            >
              <Text
                variant="bodySmall"
                style={{
                  color: selected ? '#fff' : colors.textPrimary,
                  fontWeight: selected ? '700' : '400',
                }}
              >
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {totalSelected > 0 && (
        <Text
          variant="bodySmall"
          style={{ color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }}
        >
          {t('transactions.bulkRevenue.monthsSelected', {
            count: totalSelected,
            defaultValue: '{{count}} months selected',
          })}
        </Text>
      )}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    width: '23%',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ---------------------------------------------------------------------------
// BulkRevenueForm
// ---------------------------------------------------------------------------

export function BulkRevenueForm({ onSuccess, onDirtyChange }: BulkRevenueFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language, isRtl } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const rtlInputStyle = useRtlInputStyle();
  const rtlLabelStyle = useRtlLabelStyle();
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
  const [paymentOpen, setPaymentOpen] = useState(false);
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

  const periodValueOptions = useMemo(
    () =>
      periodType !== 'custom'
        ? generatePeriodOptions(periodType, locale)
        : [],
    [periodType, locale],
  );

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

  const paymentMethodLabel = useMemo(() => {
    const labels: Record<string, string> = {
      bit: t('transactions.paymentMethodBit', { defaultValue: 'Bit' }),
      cash: t('transactions.paymentMethodCash', { defaultValue: 'Cash' }),
      bank_transfer: t('transactions.paymentMethodBankTransfer', { defaultValue: 'Bank transfer' }),
    };
    return paymentMethod ? labels[paymentMethod] : '—';
  }, [paymentMethod, t]);

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
      Alert.alert(
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
      Alert.alert(
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
        Alert.alert(
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
      Alert.alert(
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

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={spacing.keyboardExtraScrollHeight}
        bounces={false}
      >
        {/* ── Filters ──────────────────────────────────────────────────── */}
        <View style={styles.filtersSection}>
          {/* Owner filter */}
          {ownerOptions.length > 1 && (
            <View style={styles.fieldWrap}>
              <Text
                variant="labelMedium"
                style={[styles.fieldLabel, rtlLabelStyle, { color: colors.textSecondary }]}
              >
                {t('transactions.bulkRevenue.ownerFilter', { defaultValue: 'Owner' })}
              </Text>
              <View style={{ direction: 'ltr' }}>
                <Dropdown
                  data={ownerOptions}
                  labelField="label"
                  valueField="value"
                  value={ownerFilter}
                  onChange={(item) => setOwnerFilter(item.value)}
                  style={[
                    styles.dropdown,
                    { backgroundColor: colors.inputFilledBackground, borderColor: colors.outline },
                  ]}
                  containerStyle={[
                    styles.dropdownContainer,
                    { backgroundColor: colors.surface, borderColor: colors.outline },
                  ]}
                  selectedTextStyle={[
                    styles.dropdownText,
                    rtlInputStyle,
                    { color: colors.textPrimary, textAlign: isRtl ? 'right' : 'left' },
                  ]}
                  itemTextStyle={[rtlInputStyle, { color: colors.textPrimary }]}
                  placeholderStyle={[
                    styles.dropdownText,
                    { color: colors.placeholder, textAlign: isRtl ? 'right' : 'left' },
                  ]}
                  placeholder={t('transactions.bulkRevenue.allOwners', { defaultValue: 'All owners' })}
                />
              </View>
            </View>
          )}

          {/* Period type */}
          <View style={styles.fieldWrap}>
            <Text
              variant="labelMedium"
              style={[styles.fieldLabel, rtlLabelStyle, { color: colors.textSecondary }]}
            >
              {t('transactions.bulkRevenue.timePeriod', { defaultValue: 'Period' })}
            </Text>
            <SegmentedButtons
              value={periodType}
              onValueChange={(v) => handleChangePeriodType(v as TimePeriodType)}
              buttons={[
                {
                  value: '1month',
                  label: t('transactions.bulkRevenue.oneMonth', { defaultValue: '1 Month' }),
                },
                {
                  value: 'quarter',
                  label: t('transactions.bulkRevenue.lastQuarter', { defaultValue: 'Quarter' }),
                },
                {
                  value: 'year',
                  label: t('transactions.bulkRevenue.calendarYear', { defaultValue: 'Year' }),
                },
                {
                  value: 'custom',
                  label: t('transactions.bulkRevenue.custom', { defaultValue: 'Custom' }),
                },
              ]}
            />
          </View>

          {/* Period value dropdown (not shown for custom) */}
          {periodType !== 'custom' && (
            <View style={{ direction: 'ltr' }}>
              <Dropdown
                data={periodValueOptions}
                labelField="label"
                valueField="value"
                value={periodValue}
                onChange={(item) => setPeriodValue(item.value)}
                style={[
                  styles.dropdown,
                  { backgroundColor: colors.inputFilledBackground, borderColor: colors.outline },
                ]}
                containerStyle={[
                  styles.dropdownContainer,
                  { backgroundColor: colors.surface, borderColor: colors.outline },
                ]}
                selectedTextStyle={[
                  styles.dropdownText,
                  rtlInputStyle,
                  { color: colors.textPrimary, textAlign: isRtl ? 'right' : 'left' },
                ]}
                itemTextStyle={[rtlInputStyle, { color: colors.textPrimary }]}
              />
            </View>
          )}

          {/* Custom month grid */}
          {periodType === 'custom' && (
            <MonthGridPicker
              gridYear={gridYear}
              onYearChange={setGridYear}
              selectedMonths={customMonths}
              onToggle={handleToggleCustomMonth}
              locale={locale}
              colors={colors}
              totalSelected={customMonths.size}
              t={t}
            />
          )}
        </View>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <View style={[styles.divider, { backgroundColor: colors.outline }]} />

        {/* ── Select All ───────────────────────────────────────────────── */}
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

        {/* ── Property groups ──────────────────────────────────────────── */}
        {filteredGroups.length === 0 ? (
          <Text
            variant="bodyMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            {t('transactions.bulkRevenue.noContracts', { defaultValue: 'No contracts found.' })}
          </Text>
        ) : (
          filteredGroups.map((group) => (
            <View key={group.property.id} style={styles.propertyGroup}>
              <View style={styles.propertyHeaderRow}>
                <View
                  style={[styles.propertyAccent, { backgroundColor: colors.sectionAccent }]}
                />
                <Text
                  variant="titleSmall"
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
          ))
        )}
      </KeyboardAwareScrollView>

      {/* ── Bottom area ──────────────────────────────────────────────── */}
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
        {/* Collapsible payment details */}
        <TouchableOpacity
          style={styles.paymentHeader}
          onPress={() => setPaymentOpen((v) => !v)}
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
              control={dateForm.control}
              name="dateOfPayment"
              label={t('transactions.dateOfPayment', { defaultValue: 'Date of payment' })}
              mode="full"
            />
            <SegmentedButtons
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod | '')}
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
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || checkedIds.size === 0}
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

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  // Filters
  filtersSection: {
    marginBottom: spacing.md,
  },
  fieldWrap: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    marginBottom: spacing.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 15,
  },
  // Divider
  divider: {
    height: 1,
    marginBottom: spacing.md,
  },
  // Select All
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  selectAllLabel: {
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  // Property groups
  propertyGroup: {
    marginBottom: spacing.md,
  },
  propertyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  propertyAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  propertyHeaderText: {
    fontWeight: '700',
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  // Bottom area
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
