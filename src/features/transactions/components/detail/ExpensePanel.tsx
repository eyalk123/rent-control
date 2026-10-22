import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  cardShadow,
  darkColors,
  darkEntityColors,
  ICON_XS,
  isEntityColorKey,
  lightColors,
  lightEntityColors,
  radii,
  spacing,
} from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import { AppFab, EmptyState, Icon, LtrSection } from '@/src/shared/components/ui';
import { CategoryTag } from '@/src/features/transactions/components/shared/CategoryTag';
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
  /** Where a tapped transaction opens — a route in the host tab's own stack, so back returns here. */
  transactionHref: (id: number) => string;
  /** Opens the add-expense form for this property / renter; shown as a FAB and on the empty state. */
  onAddExpense?: () => void;
}

const BAR_AREA_HEIGHT = 90;
const MIN_SEGMENT = 2;
/** Keeps the last row's amount clear of the FAB. */
const FAB_CLEARANCE = 80;

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
  transactionHref,
  onAddExpense,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const router = useRouter();
  const { categories } = useExpenseCategories();
  const insets = useSafeAreaInsets();

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

  // Each category in its own color - the one on its chips and on supplier rows - so the
  // chart and the rest of the app agree. Six colors are shared by every category, so two
  // in one chart can match: the lower-ranked one is drawn lighter. A category without a
  // color (an old row) keeps the chart's own palette, and "Other" stays neutral.
  const entityPalette = theme.dark ? darkEntityColors : lightEntityColors;
  const { colorKeyByLabel, segmentColor } = useMemo(() => {
    const keys = new Map<string, string>();
    for (const tx of expenses) {
      const label = expenseCategoryLabel(tx, categories, t);
      if (keys.has(label)) continue;
      const id = tx.category_ids?.[0] ?? tx.category_id;
      const key = (id != null ? categories.find((c) => c.id === id)?.color : null) ?? tx.category_color;
      if (key) keys.set(label, key);
    }
    const used = new Set<string>();
    const out = new Map<string, { color: string; opacity: number }>();
    categoryTotals.forEach((cat, index) => {
      const key = keys.get(cat.id);
      if (key && isEntityColorKey(key)) {
        out.set(cat.id, { color: entityPalette[key].fg, opacity: used.has(key) ? 0.5 : 1 });
        used.add(key);
      } else {
        out.set(cat.id, { color: categoryColor(index, cat.id, colors.textSecondary), opacity: 1 });
      }
    });
    return { colorKeyByLabel: keys, segmentColor: out };
  }, [expenses, categories, categoryTotals, entityPalette, colors.textSecondary, t]);
  const colorOf = (id: string) => segmentColor.get(id) ?? { color: colors.textSecondary, opacity: 1 };

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
        actionLabel={onAddExpense ? t('transactions.addExpense') : undefined}
        onAction={onAddExpense}
      />
    );
  }

  const toggleMonth = (monthIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMonthChange(selectedMonth === monthIndex ? null : monthIndex);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, onAddExpense && { paddingBottom: FAB_CLEARANCE + insets.bottom }]}
      >
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
            value={categoryTotals[0]?.label ?? '–'}
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
                      {stackCategories.map((cat) => {
                        const value = stack.byCategory[cat.id] ?? 0;
                        if (value <= 0) return null;
                        const seg = colorOf(cat.id);
                        return (
                          <View
                            key={cat.id}
                            style={{
                              height: Math.max(MIN_SEGMENT, (value / maxMonth) * BAR_AREA_HEIGHT),
                              backgroundColor: seg.color,
                              opacity: seg.opacity * (dimmed ? 0.25 : 0.9),
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
          {categoryTotals.map((cat) => {
            const active = selectedCategory === cat.id;
            const seg = colorOf(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => onCategoryChange(active ? null : cat.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.catRow, active && { backgroundColor: colors.subtleOutline }]}
              >
                <View
                  style={[styles.swatch, { backgroundColor: seg.color, opacity: seg.opacity }]}
                />
                <Text style={[styles.catLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                  {cat.label}
                </Text>
                <View style={[styles.shareTrack, { backgroundColor: colors.subtleOutline }]}>
                  <View
                    style={{
                      width: `${Math.max(cat.share * 100, 2)}%`,
                      height: '100%',
                      backgroundColor: seg.color,
                      opacity: seg.opacity,
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

        {/* White cards like the Transactions list, with the category as a chip in its color.
            They were filled with the expense tint, a heavy block of copper per row. */}
        {visible.map((tx) => {
          const label = expenseCategoryLabel(tx, categories, t);
          return (
            <Pressable
              key={tx.id}
              onPress={() => router.push(transactionHref(tx.id) as never)}
              accessibilityRole="button"
              style={[styles.txCard, { backgroundColor: theme.colors.surface }]}
            >
              <View style={[styles.txIcon, { backgroundColor: colors.expBg }]}>
                <Icon name="arrow-down-right" size={ICON_XS} color={colors.expFg} />
              </View>
              <View style={styles.txBody}>
                <Text style={[styles.txTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {tx.supplier_name || label}
                </Text>
                <View style={styles.txMetaRow}>
                  <CategoryTag label={label} color={colorKeyByLabel.get(label)} />
                  <Text style={[styles.txMeta, { color: colors.textSecondary }]}>{fmtTxDate(tx, locale)}</Text>
                </View>
              </View>
              <Text style={[styles.txAmount, { color: colors.expFg }]}>
                {`\u202A\u2212${formatMoney(tx.amount)}\u202C`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {onAddExpense ? (
        <AppFab
          icon="plus"
          onPress={onAddExpense}
          accessibilityLabel={t('transactions.addExpense')}
          bottomInset={insets.bottom}
        />
      ) : null}
    </View>
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
  container: {
    flex: 1,
  },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    ...cardShadow,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // The number never yields; the title truncates instead (see TransactionRow).
  txAmount: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  txMeta: {
    fontSize: 12,
  },
});
