import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import { EmptyState, LtrSection } from '@/src/shared/components/ui';
import { formatMoney } from '@/src/shared/utils/money';
import { fmtTxDate } from '@/src/features/transactions/utils/aggregate';
import { useExpenseCategories } from '@/src/features/transactions/hooks/useTransactions';
import {
  buildCategoryTotals,
  buildMonthStacks,
  categoryColor,
  expenseCategoryLabel,
  filterExpensesForYear,
  listExpenseYears,
  selectStackCategories,
} from '@/src/features/transactions/utils/expenseBreakdown';
import type { Transaction } from '@/src/shared/types';

/** Either theme's palette. `typeof lightColors` alone is a literal type the dark set can't satisfy. */
type Palette = typeof lightColors | typeof darkColors;

interface Props {
  transactions: Transaction[];
  /**
   * The three selections are lifted to the detail screen, which outlives this panel —
   * switching detail tabs unmounts it, and losing the filter every time you glanced at the
   * lease was the complaint.
   */
  year: number | null;
  onYearChange: (year: number) => void;
  month: number | null;
  onMonthChange: (month: number | null) => void;
  category: string | null;
  onCategoryChange: (category: string | null) => void;
}

const BAR_AREA_HEIGHT = 90;
const MIN_SEGMENT = 2;

/**
 * The Expenses half of the detail-screen transactions tab.
 *
 * Answers "where does the money go and when" before it answers "what happened": a stacked
 * month chart for seasonality and composition, a ranked category list for share, and the
 * transaction rows underneath — filtered by whatever you tapped.
 *
 * Built from plain Views, like `MonthsBarChart` — this app deliberately carries no chart
 * library, and a stacked bar is just nested boxes.
 */
export function ExpensePanel({
  transactions,
  year: yearProp,
  onYearChange,
  month: selectedMonth,
  onMonthChange,
  category: selectedCategory,
  onCategoryChange,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const router = useRouter();
  const { categories } = useExpenseCategories();

  const monthLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i, 1).toLocaleDateString(locale, { month: 'narrow' }),
      ),
    [locale],
  );

  const years = useMemo(() => listExpenseYears(transactions), [transactions]);
  const currentYear = new Date().getFullYear();
  const year =
    yearProp != null && years.includes(yearProp)
      ? yearProp
      : years.includes(currentYear)
        ? currentYear
        : years[years.length - 1];

  const expenses = useMemo(
    () => (year == null ? [] : filterExpensesForYear(transactions, year)),
    [transactions, year],
  );
  const categoryTotals = useMemo(
    () => buildCategoryTotals(expenses, categories, t),
    [expenses, categories, t],
  );
  const stackCategories = useMemo(
    () => selectStackCategories(categoryTotals, t),
    [categoryTotals, t],
  );
  const stacks = useMemo(
    () => buildMonthStacks(expenses, stackCategories, categories, t),
    [expenses, stackCategories, categories, t],
  );

  const total = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const monthsWithSpend = stacks.filter((s) => s.total > 0).length;
  const maxMonth = stacks.reduce((max, s) => Math.max(max, s.total), 0) || 1;

  const visible = useMemo(
    () =>
      expenses.filter((tx) => {
        if (selectedMonth != null && Number(tx.date_of_payment.slice(5, 7)) - 1 !== selectedMonth) return false;
        if (selectedCategory != null && expenseCategoryLabel(tx, categories, t) !== selectedCategory) return false;
        return true;
      }),
    [expenses, selectedMonth, selectedCategory, categories, t],
  );

  if (year == null || expenses.length === 0) {
    return (
      <EmptyState
        icon="receipt"
        message={t('transactions.expenseChart.noExpenses', { defaultValue: 'No expenses recorded yet.' })}
      />
    );
  }

  const toggleMonth = (monthIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMonthChange(selectedMonth === monthIndex ? null : monthIndex);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {years.length > 1 ? (
        <View style={styles.yearRow}>
          {years.map((y) => {
            const active = y === year;
            return (
              <Pressable
                key={y}
                onPress={() => {
                  onYearChange(y);
                  onMonthChange(null);
                  onCategoryChange(null);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.yearChip,
                  {
                    backgroundColor: active ? theme.colors.primary : colors.subtleOutline,
                    borderColor: active ? theme.colors.primary : colors.outline,
                  },
                ]}
              >
                <Text style={[styles.yearText, { color: active ? '#fff' : colors.textSecondary }]}>{y}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* KPI strip */}
      <View style={styles.kpiRow}>
        <Kpi
          label={t('transactions.expenseChart.total', { defaultValue: 'Total' })}
          value={formatMoney(total)}
          colors={colors}
          ltr
        />
        <Kpi
          label={t('transactions.expenseChart.avgPerMonth', { defaultValue: 'Average / month' })}
          value={formatMoney(monthsWithSpend > 0 ? total / monthsWithSpend : 0)}
          colors={colors}
          ltr
        />
        <Kpi
          label={t('transactions.expenseChart.topCategory', { defaultValue: 'Biggest category' })}
          value={categoryTotals[0]?.label ?? '—'}
          colors={colors}
        />
      </View>

      {/* Stacked months. The axis is a temporal scale, so it stays LTR even in Hebrew. */}
      <LtrSection>
        <View style={[styles.chart, { borderColor: colors.outline }]}>
          {stacks.map((stack) => {
            const selected = selectedMonth === stack.monthIndex;
            const dimmed = selectedMonth != null && !selected;
            return (
              <Pressable
                key={stack.monthIndex}
                onPress={() => toggleMonth(stack.monthIndex)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${monthLabels[stack.monthIndex]}, ${formatMoney(stack.total)}`}
                style={[styles.column, selected && { backgroundColor: colors.subtleOutline }]}
              >
                <View style={styles.barArea}>
                  <View style={styles.stack}>
                    {stackCategories.map((cat, index) => {
                      const value = stack.byCategory[cat.id] ?? 0;
                      if (value <= 0) return null;
                      return (
                        <View
                          key={cat.id}
                          style={{
                            height: Math.max(MIN_SEGMENT, (value / maxMonth) * BAR_AREA_HEIGHT),
                            backgroundColor: categoryColor(index, cat.id, colors.textSecondary),
                            opacity: dimmed ? 0.25 : 0.9,
                          }}
                        />
                      );
                    })}
                  </View>
                </View>
                <Text style={[styles.monthLabel, { color: selected ? colors.textPrimary : colors.textSecondary }]}>
                  {monthLabels[stack.monthIndex]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LtrSection>

      {/* Category breakdown */}
      <View style={{ gap: spacing.xs }}>
        {categoryTotals.map((cat, index) => {
          const active = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onCategoryChange(active ? null : cat.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.catRow, active && { backgroundColor: colors.subtleOutline }]}
            >
              <View
                style={[styles.swatch, { backgroundColor: categoryColor(index, cat.id, colors.textSecondary) }]}
              />
              <Text style={[styles.catLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                {cat.label}
              </Text>
              <View style={[styles.shareTrack, { backgroundColor: colors.subtleOutline }]}>
                <View
                  style={{
                    width: `${Math.max(cat.share * 100, 2)}%`,
                    height: '100%',
                    backgroundColor: categoryColor(index, cat.id, colors.textSecondary),
                    borderRadius: 999,
                  }}
                />
              </View>
              <Text style={[styles.catAmount, { color: colors.textPrimary }]}>{formatMoney(cat.total)}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedMonth != null || selectedCategory != null ? (
        <Pressable
          onPress={() => {
            onMonthChange(null);
            onCategoryChange(null);
          }}
          accessibilityRole="button"
        >
          <Text style={[styles.clear, { color: theme.colors.primary }]}>
            {t('transactions.expenseChart.clearFilter', { defaultValue: 'Clear filter' })}
          </Text>
        </Pressable>
      ) : null}

      {visible.map((tx) => (
        <Pressable
          key={tx.id}
          onPress={() => router.push(`/transactions/${tx.id}` as never)}
          style={[styles.txCard, { backgroundColor: colors.expBg, borderColor: colors.outline }]}
        >
          <View style={styles.txHeader}>
            <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {tx.supplier_name || expenseCategoryLabel(tx, categories, t)}
            </Text>
            <Text style={[styles.txAmount, { color: colors.expFg }]}>{formatMoney(tx.amount)}</Text>
          </View>
          <Text style={[styles.txMeta, { color: colors.textSecondary }]}>{fmtTxDate(tx, locale)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function Kpi({
  label,
  value,
  colors,
  ltr,
}: {
  label: string;
  value: string;
  colors: Palette;
  ltr?: boolean;
}) {
  const body = (
    <Text style={[styles.kpiValue, { color: colors.textPrimary }]} numberOfLines={1}>
      {value}
    </Text>
  );
  return (
    <View style={[styles.kpi, { borderColor: colors.outline }]}>
      <Text style={[styles.kpiLabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      {ltr ? <LtrSection>{body}</LtrSection> : body}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  yearRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  yearChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  yearText: {
    fontSize: 12,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  kpi: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  kpiLabel: {
    fontSize: 10,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 2,
  },
  barArea: {
    height: BAR_AREA_HEIGHT,
    justifyContent: 'flex-end',
  },
  stack: {
    width: 12,
    flexDirection: 'column-reverse',
    borderRadius: 2,
    overflow: 'hidden',
  },
  monthLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  catLabel: {
    flex: 1,
    fontSize: 13,
  },
  shareTrack: {
    width: 60,
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  catAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  clear: {
    fontSize: 13,
    fontWeight: '600',
  },
  txCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  txTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  txMeta: {
    fontSize: 12,
    marginTop: 2,
  },
});
