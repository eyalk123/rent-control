import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { CpiChip, DetailRow, DetailSection } from '@/src/shared/components/ui';
import { formatMoney } from '@/src/shared/utils/money';
import { getLeaseYearLabel, isCurrentLeaseYear } from '@/src/shared/utils/leaseYear';
import { isUnsettledCpiYear } from '@/src/shared/utils/leaseSchedule';
import { DEFAULT_PAYMENT_DAY_NUM } from '@/src/shared/constants/paymentDay';
import { paymentFrequencyLabel, type Renter } from '@/src/shared/types';
import { isOpenEnded } from '@/src/shared/utils/renterStatus';

interface RenterLeaseInfoDisplayCardProps {
  renter: Renter;
  paymentTypeLabel: (type: string) => string;
}

export function RenterLeaseInfoDisplayCard({ renter, paymentTypeLabel }: RenterLeaseInfoDisplayCardProps) {
  // Named, not numbered: "4" meant nothing on a screen whose own form offers
  // Monthly / Quarterly / Yearly. An unsupported stored value still shows itself
  // ("6 per year") rather than rendering blank.
  const frequency = paymentFrequencyLabel(renter.number_of_payments);
  const { t, i18n: { language } } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const hasLeaseYears = renter.lease_years && renter.lease_years.length > 0;

  // CPI-linked years that haven't started yet: the index for their anniversary isn't
  // published, so the stored amount is only a projection off the latest known index.
  const projected = (renter.lease_years ?? []).map((_, i) =>
    isUnsettledCpiYear(renter.lease_years, i, renter.lease_start, renter.rent_escalation_mode),
  );
  const hasProjected = projected.some(Boolean);

  return (
    <DetailSection title={t('renter.leaseInfo')}>
      {/* Said once above the list rather than per row: the tail is projection, and the one
          thing a reader needs to know is that it extends itself rather than running out. */}
      {isOpenEnded(renter) && (
        <Text variant="bodySmall" style={[styles.generatedNote, { color: colors.textSecondary }]}>
          {t('renter.openEndedGeneratedNote')}
        </Text>
      )}
      {hasProjected && (
        <Text variant="bodySmall" style={[styles.generatedNote, { color: colors.textSecondary }]}>
          {t('renter.cpiTimelineProjectedNote')}
        </Text>
      )}
      {hasLeaseYears && (
        <ScrollView
          style={styles.leaseYearsScroll}
          nestedScrollEnabled
          // Indicator deliberately on. It was switched off, which left a capped list with no
          // affordance at all: a lease with many periods looked complete at four rows.
          showsVerticalScrollIndicator
          persistentScrollbar
        >
          {[...renter.lease_years].reverse().map((year, reversedIdx) => {
            const idx = renter.lease_years.length - 1 - reversedIdx;
            const isCurrent = isCurrentLeaseYear(renter.lease_start, renter.lease_years, idx);
            const isProjected = projected[idx];
            return (
              <View key={idx}>
                {reversedIdx > 0 && (
                  <View style={[styles.separator, { backgroundColor: colors.outline }]} />
                )}
                <View
                  style={[
                    styles.leaseYearRow,
                    // The active period is marked by weight and a faint tint rather than by
                    // a 30%-opacity fill with amber text. That fill read as "disabled", and
                    // the amber was a hardcoded hex that failed contrast on white.
                    isCurrent && { backgroundColor: colors.primary + '0F' },
                  ]}
                >
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.leaseYearLabel,
                      {
                        color: isCurrent ? colors.textPrimary : colors.textSecondary,
                        fontWeight: isCurrent ? '700' : '400',
                      },
                    ]}
                  >
                    {getLeaseYearLabel(renter.lease_start, renter.lease_years, idx, language)}
                  </Text>
                  <View style={styles.leaseYearValue}>
                    <Text
                      variant="bodyMedium"
                      style={{
                        // Muted with a "≈", as in the renter form: an estimate shouldn't read
                        // with the same weight as a rent that is already final.
                        color: isProjected ? colors.textSecondary : colors.textPrimary,
                        fontWeight: isCurrent ? '700' : '600',
                      }}
                    >
                      {`${isProjected ? '≈ ' : ''}${formatMoney(year.amount)} (${
                        // A generated period is neither a term the owner agreed nor an option
                        // the tenant took — it is the horizon the server keeps ahead of today.
                        // Saying "Contract" about it would be the one wrong word here.
                        year.generated
                          ? t('renter.openEndedGenerated')
                          : year.type === 'contract'
                            ? t('renter.leaseYearTypeContract')
                            : t('renter.leaseYearTypeOption')
                      })`}
                    </Text>
                    {isProjected && <CpiChip style={styles.cpiChip} />}
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* A renter saved before the form pre-filled this still has no stored day, but the
          overdue engine already chases them on the 1st — so show that rather than hiding the
          row, which left the behaviour unexplained. */}
      <DetailRow
        label={t('renter.dateOfPayment')}
        value={
          renter.payment_day_of_month != null
            ? String(renter.payment_day_of_month)
            : t('renter.dateOfPaymentDefault', { day: DEFAULT_PAYMENT_DAY_NUM })
        }
      />
      {renter.payment_type != null && renter.payment_type !== '' && (
        <DetailRow
          label={t('renter.paymentType')}
          value={paymentTypeLabel(renter.payment_type)}
        />
      )}
      {frequency && (
        <DetailRow
          label={t('renter.paymentFrequency', { defaultValue: 'Payment frequency' })}
          value={t(frequency.key, { count: frequency.count })}
        />
      )}
    </DetailSection>
  );
}

/**
 * Row height, and how many rows the list is capped at.
 *
 * The half row is the point: a list that stops flush on a row boundary reads as a complete
 * list, so the cap deliberately slices the fifth row through the middle. Derived from the
 * row height rather than hardcoded, so the clip stays mid-row if the row metrics change.
 */
const LEASE_ROW_HEIGHT = 48;
const LEASE_ROWS_VISIBLE = 4.5;

const styles = StyleSheet.create({
  generatedNote: {
    marginBottom: spacing.sm,
  },
  leaseYearsScroll: {
    maxHeight: LEASE_ROW_HEIGHT * LEASE_ROWS_VISIBLE,
  },
  leaseYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  leaseYearLabel: {
    flexShrink: 1,
  },
  leaseYearValue: {
    flexShrink: 1,
    // Amount and CPI chip stack against the row's end edge; flex-end follows the layout
    // direction, so in Hebrew they hug the left like the amount alone always did.
    alignItems: 'flex-end',
  },
  cpiChip: {
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginStart: spacing.lg,
  },
});
