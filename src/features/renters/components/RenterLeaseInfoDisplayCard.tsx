import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { DetailRow, DetailSection } from '@/src/shared/components/ui';
import { formatMoney } from '@/src/shared/utils/money';
import { getLeaseYearLabel, isCurrentLeaseYear } from '@/src/shared/utils/leaseYear';
import { DEFAULT_PAYMENT_DAY_NUM } from '@/src/shared/constants/paymentDay';
import type { Renter } from '@/src/shared/types';

interface RenterLeaseInfoDisplayCardProps {
  renter: Renter;
  paymentTypeLabel: (type: string) => string;
}

export function RenterLeaseInfoDisplayCard({ renter, paymentTypeLabel }: RenterLeaseInfoDisplayCardProps) {
  const { t, i18n: { language } } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const hasLeaseYears = renter.lease_years && renter.lease_years.length > 0;

  return (
    <DetailSection title={t('renter.leaseInfo')}>
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
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.leaseYearValue,
                      {
                        color: colors.textPrimary,
                        fontWeight: isCurrent ? '700' : '600',
                      },
                    ]}
                  >
                    {`${formatMoney(year.amount)} (${
                      year.type === 'contract'
                        ? t('renter.leaseYearTypeContract')
                        : t('renter.leaseYearTypeOption')
                    })`}
                  </Text>
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
      {renter.number_of_payments != null && (
        <DetailRow
          label={t('renter.numberOfPayments')}
          value={String(renter.number_of_payments)}
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
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginStart: spacing.lg,
  },
});
