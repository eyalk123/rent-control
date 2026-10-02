import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { darkColors, lightColors, radii, spacing } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import { Icon, LtrSection } from '@/src/shared/components/ui';
import { formatMoney } from '@/src/shared/utils/money';
import type { MonthCell } from '@/src/features/transactions/utils/rentSchedule';
import type { Renter, Transaction } from '@/src/shared/types';

interface Props {
  /** Null hides the sheet. */
  month: { renter: Renter; cell: MonthCell } | null;
  /** "Mar 2026", already localised by the caller. */
  title: string;
  onDismiss: () => void;
  onOpenTransaction: (tx: Transaction) => void;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" as a local date, so it compares against the local due date day for day. */
function parseLocalDate(iso: string): Date | null {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/**
 * What one paid month in the rent grid actually says, in words.
 *
 * The grid box shows status only. Whether the payment was late, how much it differed from
 * what was asked, and whether the lease has changed since are all here instead, where
 * there is room to say them as sentences rather than as corner markers.
 */
export function RentMonthSheet({ month, title, onDismiss, onOpenTransaction }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { language, isRtl } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const cell = month?.cell;
  const renter = month?.renter;

  const sorted = cell
    ? [...cell.transactions].sort((a, b) => a.date_of_payment.localeCompare(b.date_of_payment))
    : [];

  let lateDays = 0;
  if (cell?.isLate && cell.dueDate && sorted[0]) {
    const paidOn = parseLocalDate(sorted[0].date_of_payment);
    if (paidOn) lateDays = Math.max(1, Math.round((paidOn.getTime() - cell.dueDate.getTime()) / DAY_MS));
  }

  const formatDay = (iso: string) =>
    parseLocalDate(iso)?.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) ?? iso;

  return (
    <Modal visible={month != null} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={[StyleSheet.absoluteFillObject, styles.backdrop]} onPress={onDismiss} />
      <View style={styles.container} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.dark ? darkColors.surfaceElevated : colors.surface,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.outline }]} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text variant="titleMedium" style={{ color: colors.textPrimary, fontWeight: '700' }}>
                {title}
              </Text>
              {renter ? (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {`${renter.first_name} ${renter.last_name}`}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onDismiss}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.close', { defaultValue: 'Close' })}
              style={[styles.closeBtn, { backgroundColor: colors.controlFill }]}
            >
              <Icon name="x" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          {cell ? (
            <View style={styles.body}>
              <View style={styles.amountRow}>
                <Text style={[styles.status, { color: colors.revFg }]}>
                  {`✓ ${t('transactions.rentStatus.paid')}`}
                </Text>
                <LtrSection>
                  <Text style={[styles.amount, { color: colors.textPrimary }]}>
                    {formatMoney(cell.paidSum)}
                  </Text>
                </LtrSection>
              </View>

              {/* Something to chase, so it carries the warning bar. */}
              {cell.hasAmountMismatch ? (
                <Note barColor={colors.warning} textColor={colors.textPrimary}>
                  {t('transactions.rentGrid.sheetExpected', {
                    amount: formatMoney(cell.quotedAtPayment ?? cell.expected),
                    defaultValue: 'Expected {{amount}} at the time',
                  })}
                </Note>
              ) : null}

              {lateDays > 0 ? (
                <Note barColor={colors.warning} textColor={colors.textPrimary}>
                  {t(
                    lateDays === 1
                      ? 'transactions.rentGrid.sheetLateBy'
                      : 'transactions.rentGrid.sheetLateByPlural',
                    { count: lateDays, defaultValue: 'Paid {{count}} days after the due date' },
                  )}
                </Note>
              ) : null}

              {/* Nobody owes anything here, so it stays muted: a note, not a warning. */}
              {cell.leaseChangedSince ? (
                <Note barColor={colors.textSecondary} textColor={colors.textSecondary}>
                  {t('transactions.rentGrid.sheetLeaseChanged', {
                    amount: formatMoney(cell.expected),
                    defaultValue: 'Matched the lease when paid. The lease now says {{amount}}.',
                  })}
                </Note>
              ) : null}

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                {t('transactions.rentGrid.sheetPayments', { defaultValue: 'Payments' })}
              </Text>
              {sorted.map((tx) => (
                <TouchableRipple
                  key={tx.id}
                  onPress={() => onOpenTransaction(tx)}
                  borderless
                  accessibilityRole="button"
                  style={[styles.txRow, { backgroundColor: colors.controlFill }]}
                >
                  <View style={styles.txRowInner}>
                    <Text style={[styles.txDate, { color: colors.textPrimary }]}>
                      {formatDay(tx.date_of_payment)}
                    </Text>
                    <LtrSection>
                      <Text style={[styles.txAmount, { color: colors.textPrimary }]}>
                        {formatMoney(tx.amount)}
                      </Text>
                    </LtrSection>
                    <Icon
                      name={isRtl ? 'chevron-left' : 'chevron-right'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </View>
                </TouchableRipple>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

/** A line with a coloured bar beside it. The bar carries the tone; the text stays readable. */
function Note({
  barColor,
  textColor,
  children,
}: {
  barColor: string;
  textColor: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.note}>
      <View style={[styles.noteBar, { backgroundColor: barColor }]} />
      <Text style={[styles.noteText, { color: textColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    maxHeight: '70%',
    paddingTop: spacing.xs,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerText: {
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  status: {
    fontSize: 15,
    fontWeight: '700',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  noteBar: {
    width: 3,
    borderRadius: 2,
  },
  noteText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  txRow: {
    borderRadius: radii.md,
  },
  txRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  txDate: {
    flex: 1,
    fontSize: 14,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
