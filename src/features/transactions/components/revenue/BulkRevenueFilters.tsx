import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-native-element-dropdown';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext, useRtlInputStyle, useRtlLabelStyle } from '@/src/context';
import type { TimePeriodType } from '@/src/features/transactions/screens/types';
import { MonthGridPicker } from './MonthGridPicker';
import { generatePeriodOptions } from './periodHelpers';

type OwnerOption = { label: string; value: string | null };

type BulkRevenueFiltersProps = {
  ownerOptions: OwnerOption[];
  ownerFilter: string | null;
  onOwnerChange: (value: string | null) => void;

  periodType: TimePeriodType;
  onPeriodTypeChange: (type: TimePeriodType) => void;

  periodValue: string;
  onPeriodValueChange: (value: string) => void;

  customMonths: Set<string>;
  onToggleCustomMonth: (monthStr: string) => void;
  gridYear: number;
  onGridYearChange: (year: number) => void;
};

export function BulkRevenueFilters({
  ownerOptions,
  ownerFilter,
  onOwnerChange,
  periodType,
  onPeriodTypeChange,
  periodValue,
  onPeriodValueChange,
  customMonths,
  onToggleCustomMonth,
  gridYear,
  onGridYearChange,
}: BulkRevenueFiltersProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language, isRtl } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const rtlInputStyle = useRtlInputStyle();
  const rtlLabelStyle = useRtlLabelStyle();

  const periodValueOptions = useMemo(
    () =>
      periodType !== 'custom'
        ? generatePeriodOptions(periodType, locale)
        : [],
    [periodType, locale],
  );

  const dropdownTheme = {
    style: [
      styles.dropdown,
      { backgroundColor: colors.inputFilledBackground, borderColor: colors.outline },
    ],
    containerStyle: [
      styles.dropdownContainer,
      { backgroundColor: colors.surface, borderColor: colors.outline },
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

  return (
    <View style={styles.filtersSection}>
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
              onChange={(item) => onOwnerChange(item.value)}
              placeholder={t('transactions.bulkRevenue.allOwners', { defaultValue: 'All owners' })}
              {...dropdownTheme}
            />
          </View>
        </View>
      )}

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
              value: 'quarter',
              label: t('transactions.bulkRevenue.lastQuarter', { defaultValue: 'Qtr' }),
              labelStyle: { fontSize: 12 },
              style: { flex: 1, minWidth: 0 },
            },
            {
              value: 'year',
              label: t('transactions.bulkRevenue.calendarYear', { defaultValue: 'Year' }),
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
            {periodType === '1month'
              ? t('transactions.bulkRevenue.selectMonth', { defaultValue: 'Month' })
              : periodType === 'quarter'
                ? t('transactions.bulkRevenue.selectQuarter', { defaultValue: 'Quarter' })
                : t('transactions.bulkRevenue.selectYear', { defaultValue: 'Year' })}
          </Text>
          <View style={{ direction: 'ltr' }}>
            <Dropdown
              data={periodValueOptions}
              labelField="label"
              valueField="value"
              value={periodValue}
              onChange={(item) => onPeriodValueChange(item.value)}
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
});
