import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import { EmptyState, LtrSection } from '@/src/shared/components/ui';
import { formatMoney } from '@/src/shared/utils/money';
import { monthLabel as monthLabelFor } from '@/src/features/transactions/utils/aggregate';
import { markRentPaid } from '@/src/features/transactions/utils/markRentPaid';
import {
  buildRentGrid,
  listPayableYearsForRenters,
  summariseRentYear,
  type MonthCell,
} from '@/src/features/transactions/utils/rentSchedule';
import {
  isNonMonthlyCadence,
  paymentFrequencyLabel,
  type Renter,
  type Transaction,
} from '@/src/shared/types';
import { RentMonthBox } from './RentMonthBox';
import { RentGridLegend } from './RentGridLegend';

interface Props {
  /** One renter on a renter screen; every renter on the property (past ones included). */
  renters: Renter[];
  transactions: Transaction[];
  /** Fallback when a renter has no property_id of their own. */
  propertyId?: number | null;
  onRecorded: () => void;
  /**
   * `stacked` shows every lease year at once, newest first — the renter screen, where the
   * run of years *is* the lease. `single-year` keeps the year chips, for the property matrix
   * where every extra year multiplies by the number of renters.
   */
  layout?: 'stacked' | 'single-year';
  /** `single-year` only: the selected year, lifted so it survives a tab switch. */
  year?: number | null;
  onYearChange?: (year: number) => void;
}

interface Pending {
  renter: Renter;
  cell: MonthCell;
}

interface GridRow {
  renter: Renter;
  cells: MonthCell[];
}

/**
 * The Revenue half of the detail-screen transactions tab: a 12-month payment grid per
 * renter, per calendar year.
 *
 * One renter renders as a single strip; a property with several renders as a
 * renter × month matrix, which is what makes turnover legible — you can see one lease end
 * mid-year and the next begin.
 */
export function RevenuePaymentPanel({
  renters,
  transactions,
  propertyId,
  onRecorded,
  layout = 'single-year',
  year: yearProp,
  onYearChange,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const router = useRouter();

  const years = useMemo(() => listPayableYearsForRenters(renters), [renters]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to the current year when the lease covers it, else the most recent year that
  // does — a lease that ended in 2024 should open on 2024, not on an empty 2026.
  const currentYear = new Date().getFullYear();
  const selectedYear =
    yearProp != null && years.includes(yearProp)
      ? yearProp
      : years.includes(currentYear)
        ? currentYear
        : years[years.length - 1];

  // Newest first in the stack: the year you are most likely to be recording against is the
  // one you land on, without scrolling past the history to reach it.
  const shownYears = useMemo(
    () => (layout === 'stacked' ? [...years].reverse() : selectedYear != null ? [selectedYear] : []),
    [layout, years, selectedYear],
  );

  const rowsByYear = useMemo(() => {
    const map = new Map<number, GridRow[]>();
    for (const y of shownYears) {
      map.set(
        y,
        renters
          .map((renter) => ({
            renter,
            cells: buildRentGrid(
              renter,
              y,
              transactions.filter((tx) => tx.renter_id === renter.id),
            ),
          }))
          // A renter whose lease does not reach into this year has nothing to show.
          .filter(({ cells }) => cells.some((c) => c.status !== 'outside-lease')),
      );
    }
    return map;
  }, [renters, transactions, shownYears]);

  if (renters.length === 0 || shownYears.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        message={t('transactions.rentGrid.noLease', {
          defaultValue: 'No lease dates recorded, so there is nothing to track payments against.',
        })}
      />
    );
  }

  const handleSelect = (renter: Renter, cell: MonthCell) => {
    if (cell.isPayable) {
      setPending({ renter, cell });
      return;
    }
    // A paid box is a shortcut into the money it represents.
    if (cell.transactions.length > 0) router.push(`/transactions/${cell.transactions[0].id}` as never);
  };

  const handleConfirm = async () => {
    if (!pending) return;
    const targetProperty = pending.renter.property_id ?? propertyId;
    if (!targetProperty) {
      setError(
        t('transactions.rentGrid.noPropertyLinked', {
          defaultValue: 'This renter is not linked to a property, so rent cannot be recorded.',
        }),
      );
      setPending(null);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await markRentPaid({
        property_id: targetProperty,
        renter_id: pending.renter.id,
        amount: pending.cell.expected,
        monthFor: pending.cell.monthKey,
        paymentType: pending.renter.payment_type,
      });
      setPending(null);
      onRecorded();
    } catch {
      setError(t('error.saveTransactionFailed', { defaultValue: 'Failed to record payment. Please try again.' }));
    } finally {
      setSaving(false);
    }
  };

  const renderSummary = (rows: GridRow[]) => {
    const totals = summariseRentYear(rows.flatMap((r) => r.cells));
    return (
      <View style={styles.summaryBlock}>
        <LtrSection>
          <Text style={[styles.summary, { color: colors.textSecondary }]}>
            {t('transactions.rentGrid.summary', {
              collected: formatMoney(totals.collected),
              expected: formatMoney(totals.expected),
              defaultValue: '{{collected}} collected of {{expected}}',
            })}
          </Text>
        </LtrSection>
        {totals.outstandingMonths > 0 ? (
          <Text style={[styles.summary, { color: colors.expFg }]}>
            {t(
              totals.outstandingMonths === 1
                ? 'transactions.rentGrid.outstanding'
                : 'transactions.rentGrid.outstandingPlural',
              { count: totals.outstandingMonths, defaultValue: '{{count}} months outstanding' },
            )}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderRow = ({ renter, cells }: GridRow, showName: boolean) => {
    // A quarterly or yearly lease leaves most of its row empty by design. The badge is what
    // turns that from "why is this grid full of holes?" into "of course — it bills 4x a
    // year", and it is the only place the cadence appears on this screen.
    const cadence = isNonMonthlyCadence(renter.number_of_payments)
      ? paymentFrequencyLabel(renter.number_of_payments)
      : null;
    const cadenceLabel = cadence ? t(cadence.key, { count: cadence.count }) : undefined;

    return (
    <View key={renter.id} style={styles.renterBlock}>
      {showName || cadenceLabel ? (
        <View style={styles.renterHeader}>
          {showName ? (
            <Text style={[styles.renterName, { color: colors.textPrimary }]} numberOfLines={1}>
              {`${renter.first_name} ${renter.last_name}`}
            </Text>
          ) : null}
          {cadenceLabel ? (
            <View style={[styles.cadenceBadge, { borderColor: colors.subtleOutline }]}>
              <Text style={[styles.cadenceText, { color: colors.textSecondary }]}>{cadenceLabel}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.grid}>
        {cells.map((cell) => (
          <RentMonthBox
            key={cell.monthKey}
            cell={cell}
            monthLabel={monthLabelFor(cell.monthKey, locale)}
            statusLabel={t(`transactions.rentStatus.${cell.status}`, { defaultValue: cell.status })}
            extraLabel={
              // A shortfall names what was actually being asked for, which after a lease
              // edit is not what the lease says now. A month settled correctly that only
              // disagrees with the *current* lease says so in those words instead — nobody
              // owes anything, and "expected X" there would be an accusation.
              cell.hasAmountMismatch
                ? t('transactions.rentGrid.expectedWas', {
                    amount: formatMoney(cell.quotedAtPayment ?? cell.expected),
                    defaultValue: 'expected {{amount}}',
                  })
                : cell.leaseChangedSince
                  ? t('transactions.rentGrid.leaseNowSays', {
                      amount: formatMoney(cell.expected),
                      defaultValue: 'lease now says {{amount}}',
                    })
                  : undefined
            }
            lateLabel={t('transactions.rentGrid.paidLate', { defaultValue: 'paid late' })}
            notDueLabel={
              cadenceLabel
                ? `${monthLabelFor(cell.monthKey, locale)}, ${t('transactions.rentGrid.notDueReason', {
                    cadence: cadenceLabel.toLowerCase(),
                    defaultValue: 'no instalment due this month ({{cadence}} lease)',
                  })}`
                : undefined
            }
            onSelect={(c) => handleSelect(renter, c)}
            saving={saving && pending?.renter.id === renter.id && pending?.cell.monthKey === cell.monthKey}
          />
        ))}
      </View>
    </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {layout === 'single-year' && years.length > 1 ? (
        <View style={styles.yearRow}>
          {years.map((y) => {
            const active = y === selectedYear;
            return (
              <Pressable
                key={y}
                onPress={() => onYearChange?.(y)}
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
                <Text style={[styles.yearText, { color: active ? '#fff' : colors.textSecondary }]}>
                  {y}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {shownYears.map((y) => {
        const rows = rowsByYear.get(y) ?? [];
        if (rows.length === 0) return null;
        return (
          <View key={y} style={styles.yearBlock}>
            {layout === 'stacked' ? (
              <Text style={[styles.yearHeading, { color: colors.textPrimary }]}>{String(y)}</Text>
            ) : null}
            {renderSummary(rows)}
            {rows.map((row) => renderRow(row, rows.length > 1))}
          </View>
        );
      })}

      {error ? <Text style={[styles.error, { color: colors.expFg }]}>{error}</Text> : null}

      <RentGridLegend />

      <Portal>
        <Dialog
          visible={pending != null}
          onDismiss={() => !saving && setPending(null)}
          style={styles.dialog}
        >
          <Dialog.Title>
            {t('transactions.recordPayment.title', { defaultValue: 'Record rent payment' })}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: colors.textSecondary }}>
              {pending ? `${pending.renter.first_name} ${pending.renter.last_name}` : ''}
              {pending ? ` · ${monthLabelFor(pending.cell.monthKey, locale)} ${pending.cell.monthKey.slice(0, 4)}` : ''}
            </Text>
            <LtrSection>
              <Text style={[styles.dialogAmount, { color: colors.textPrimary }]}>
                {formatMoney(pending?.cell.expected ?? 0)}
              </Text>
            </LtrSection>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPending(null)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onPress={handleConfirm} disabled={saving} mode="contained">
              {saving ? (
                <ActivityIndicator size={14} color="#fff" />
              ) : (
                t('transactions.recordPayment.confirm', { defaultValue: 'Record payment' })
              )}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Paper derives a dialog's radius as `roundness * 7` (MD3's 28 from its default
  // roundness of 4), and this theme sets roundness to 16 for cards and inputs - so a
  // dialog that does not say otherwise lands on 112 and swallows its own corners.
  // Every dialog in the app pins 16 by hand for this reason.
  dialog: {
    borderRadius: 16,
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
  yearBlock: {
    gap: spacing.xs,
  },
  yearHeading: {
    fontSize: 15,
    fontWeight: '700',
    // The year is a number, so it reads the same either way; pinning it keeps it off the
    // RTL mirror that would otherwise flip a "2026" sitting next to Hebrew text.
    writingDirection: 'ltr',
  },
  summaryBlock: {
    gap: 2,
  },
  summary: {
    fontSize: 13,
  },
  renterBlock: {
    gap: spacing.xs,
  },
  renterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cadenceBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  cadenceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  renterName: {
    flexShrink: 1,

    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    // Follows the app direction, so Hebrew reads January from the right — the same way the
    // web grid behaves. Only the expense chart's axis is pinned LTR.
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dialogAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  error: {
    fontSize: 13,
  },
});
