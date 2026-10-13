import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-native-element-dropdown';
import { Icon } from '@/src/shared/components/ui';
import { dropdownListStyle, dropdownPlacement } from '@/src/shared/components/form/dropdownPlacement';
import { useDropdownSearch } from '@/src/shared/components/form/dropdownSearch';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext, useRtlInputStyle, useRtlLabelStyle } from '@/src/context';
import type { TimePeriodType } from '@/src/features/transactions/screens/types';
import { MonthGridPicker } from './MonthGridPicker';
import { generatePeriodOptions } from './periodHelpers';

/** `pinned` keeps "All owners" in the list whatever is searched. */
type OwnerOption = { label: string; value: string | null; pinned?: boolean };

type BulkRevenueOwnerFilterProps = {
  ownerOptions: OwnerOption[];
  ownerFilter: string | null;
  onOwnerChange: (value: string | null) => void;
};

type BulkRevenuePeriodFilterProps = {
  periodType: TimePeriodType;
  onPeriodTypeChange: (type: TimePeriodType) => void;

  periodValue: string;
  onPeriodValueChange: (value: string) => void;

  customMonths: Set<string>;
  onToggleCustomMonth: (monthStr: string) => void;
  gridYear: number;
  onGridYearChange: (year: number) => void;

  /**
   * What the leases cover ("YYYY-MM" ascending / contract-year start years descending), from
   * `leaseMonthsForRenters` / `leaseContractYearsForRenters`. Null or omitted: no limit, and
   * the pickers offer the default rolling range.
   */
  leaseMonths?: string[] | null;
  contractYears?: number[] | null;
};

/**
 * Shared styling for the owner + period dropdowns. Both filters render the same
 * control, but they sit in different parts of the form (owner above the tenant
 * list, period below it), so the theme lives in a hook instead of a local object.
 */
function useDropdownTheme() {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const rtlInputStyle = useRtlInputStyle();

  return {
    ...dropdownPlacement,
    style: [
      styles.dropdown,
      { backgroundColor: 'transparent', borderColor: colors.inputBorder },
    ],
    containerStyle: [
      styles.dropdownContainer,
      { backgroundColor: colors.surface, borderColor: colors.outline },
      dropdownListStyle,
    ],
    selectedTextStyle: [
      styles.dropdownText,
      rtlInputStyle,
      { color: colors.textPrimary, textAlign: isRtl ? ('right' as const) : ('left' as const) },
    ],
    itemTextStyle: [rtlInputStyle, { color: colors.textPrimary }],
    placeholderStyle: [
      styles.dropdownText,
      { color: colors.placeholder, textAlign: isRtl ? ('right' as const) : ('left' as const) },
    ],
    activeColor: colors.inputFilledBackground,
    renderRightIcon: isRtl ? () => null : undefined,
    renderLeftIcon: isRtl
      ? () => (
          <Icon
            name="chevron-down"
            size={20}
            color={colors.placeholder}
          />
        )
      : undefined,
  };
}

export function BulkRevenueOwnerFilter({
  ownerOptions,
  ownerFilter,
  onOwnerChange,
}: BulkRevenueOwnerFilterProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();
  const dropdownTheme = useDropdownTheme();
  // Owners are the user's own data, so this one searches; the period filter beside it does not.
  const search = useDropdownSearch(ownerOptions);

  if (ownerOptions.length <= 1) return null;

  return (
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
          onChange={(item) => onOwnerChange(item.value)}
          placeholder={t('transactions.bulkRevenue.allOwners', { defaultValue: 'All owners' })}
          // Without a name the library hides the options from VoiceOver (see DropdownField).
          accessibilityLabel={[
            t('transactions.bulkRevenue.ownerFilter', { defaultValue: 'Owner' }),
            ownerOptions.find((o) => o.value === ownerFilter)?.label
              ?? t('transactions.bulkRevenue.allOwners', { defaultValue: 'All owners' }),
          ].join(', ')}
          flatListProps={{
            accessibilityLabel: t('transactions.bulkRevenue.ownerFilter', { defaultValue: 'Owner' }),
          }}
          {...dropdownTheme}
          {...search.props}
          containerStyle={[...dropdownTheme.containerStyle, search.listStyle]}
        />
      </View>
    </View>
  );
}

export function BulkRevenuePeriodFilter({
  periodType,
  onPeriodTypeChange,
  periodValue,
  onPeriodValueChange,
  customMonths,
  onToggleCustomMonth,
  gridYear,
  onGridYearChange,
  leaseMonths,
  contractYears,
}: BulkRevenuePeriodFilterProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const rtlLabelStyle = useRtlLabelStyle();
  const dropdownTheme = useDropdownTheme();

  const periodValueOptions = useMemo(() => {
    if (periodType === '1month' && leaseMonths) {
      return leaseMonths.slice().reverse().map((m) => {
        const [y, mo] = m.split('-').map(Number);
        return {
          label: new Date(y, mo - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }),
          value: m,
        };
      });
    }
    if (periodType === 'year' && contractYears) {
      return contractYears.map((y) => ({
        label: `${String(y).slice(2)}/${String(y + 1).slice(2)}`,
        value: String(y),
      }));
    }
    return periodType !== 'custom' ? generatePeriodOptions(periodType, locale) : [];
  }, [periodType, locale, leaseMonths, contractYears]);
  const leaseMonthSet = useMemo(() => (leaseMonths ? new Set(leaseMonths) : undefined), [leaseMonths]);
  const periodLabel = periodType === '1month'
    ? t('transactions.bulkRevenue.selectMonth', { defaultValue: 'Month' })
    : t('transactions.bulkRevenue.selectYear', { defaultValue: 'Year' });

  return (
    <View style={styles.filtersSection}>
      <View style={styles.fieldWrap}>
        <Text
          variant="labelMedium"
          style={[styles.fieldLabel, rtlLabelStyle, { color: colors.textSecondary }]}
        >
          {t('transactions.bulkRevenue.timePeriod', { defaultValue: 'Billing period' })}
        </Text>
        <SegmentedButtons
          value={periodType}
          onValueChange={(v) => onPeriodTypeChange(v as TimePeriodType)}
          // density="high"
          style={{ alignSelf: 'stretch' }}
          buttons={[
            {
              value: '1month',
              label: t('transactions.bulkRevenue.oneMonth', { defaultValue: 'Month' }),
              labelStyle: { fontSize: 12 },
              style: { flex: 1, minWidth: 0 },
            },
            {
              value: 'year',
              label: t('transactions.bulkRevenue.calendarYear', { defaultValue: 'Contract Yr' }),
              labelStyle: { fontSize: 12 },
              style: { flex: 1, minWidth: 0 },
            },
            {
              value: 'custom',
              label: t('transactions.bulkRevenue.custom', { defaultValue: 'Custom' }),
              labelStyle: { fontSize: 12 },
              style: { flex: 1, minWidth: 0 },
            },
          ]}
        />
      </View>

      {periodType !== 'custom' && (
        <View style={styles.fieldWrap}>
          <Text
            variant="labelMedium"
            style={[styles.fieldLabel, rtlLabelStyle, { color: colors.textSecondary }]}
          >
            {periodLabel}
          </Text>
          <View style={{ direction: 'ltr' }}>
            <Dropdown
              data={periodValueOptions}
              labelField="label"
              valueField="value"
              value={periodValue}
              onChange={(item) => onPeriodValueChange(item.value)}
              placeholder={periodType === 'year'
                ? t('transactions.bulkRevenue.selectContractYear', { defaultValue: 'Choose a contract year' })
                : periodLabel}
              accessibilityLabel={[
                periodLabel,
                periodValueOptions.find((o) => o.value === periodValue)?.label,
              ].filter(Boolean).join(', ')}
              flatListProps={{ accessibilityLabel: periodLabel }}
              {...dropdownTheme}
            />
          </View>
        </View>
      )}

      {periodType === 'custom' && (
        <MonthGridPicker
          gridYear={gridYear}
          onYearChange={onGridYearChange}
          selectedMonths={customMonths}
          onToggle={onToggleCustomMonth}
          locale={locale}
          colors={colors}
          totalSelected={customMonths.size}
          t={t}
          enabledMonths={leaseMonthSet}
          minYear={leaseMonths ? Number(leaseMonths[0].slice(0, 4)) : undefined}
          maxYear={leaseMonths ? Number(leaseMonths[leaseMonths.length - 1].slice(0, 4)) : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownText: {
    fontSize: 15,
  },
});
