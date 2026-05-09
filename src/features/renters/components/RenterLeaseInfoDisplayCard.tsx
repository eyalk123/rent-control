import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';
import { IconDetailRow } from '@/src/shared/components/ui/IconDetailRow';
import { formatMoney } from '@/src/shared/utils/money';
import { getLeaseYearLabel, isCurrentLeaseYear } from '@/src/shared/utils/leaseYear';
import type { Renter } from '@/src/shared/types';

interface RenterLeaseInfoDisplayCardProps {
  renter: Renter;
  paymentTypeLabel: (type: string) => string;
}

export function RenterLeaseInfoDisplayCard({ renter, paymentTypeLabel }: RenterLeaseInfoDisplayCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <Card style={styles.card} mode="outlined">
      <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
        <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: colors.onPrimary }]}>
          {t('renter.leaseInfo')}
        </Text>
      </View>
      <Card.Content style={styles.cardContent}>
        {renter.lease_years && renter.lease_years.length > 0 && (
          <ScrollView
            style={styles.leaseYearsScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {[...renter.lease_years].reverse().map((year, reversedIdx) => {
              const idx = renter.lease_years.length - 1 - reversedIdx;
              const isCurrent = isCurrentLeaseYear(renter.lease_start, idx);
              return (
                <View
                  key={idx}
                  style={[
                    styles.leaseYearRow,
                    isCurrent && {
                      backgroundColor: colors.primary + '4D',
                      borderRadius: 6,
                      paddingHorizontal: spacing.xs,
                    },
                  ]}
                >
                  <View style={styles.leaseYearLabelRow}>
                    <Icon name="file-text" size={20} color={colors.primary} />
                    <View style={styles.leaseYearLabelWrap}>
                      <Text
                        variant="bodyMedium"
                        style={{
                          color: isCurrent ? '#C17F00' : colors.textSecondary,
                          fontWeight: isCurrent ? '700' : '400',
                        }}
                      >
                        {getLeaseYearLabel(renter.lease_start, idx)}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={[styles.leaseYearValue, { color: colors.textPrimary }]}
                      >
                        {`${formatMoney(year.amount)} (${
                          year.type === 'contract'
                            ? t('renter.leaseYearTypeContract')
                            : t('renter.leaseYearTypeOption')
                        })`}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}

        {renter.payment_day_of_month != null && (
          <IconDetailRow
            icon="calendar-clock"
            label={t('renter.dateOfPayment')}
            value={String(renter.payment_day_of_month)}
            iconColor={colors.primary}
            secondaryColor={colors.textSecondary}
          />
        )}
        {renter.payment_type != null && renter.payment_type !== '' && (
          <IconDetailRow
            icon="arrow-right-left"
            label={t('renter.paymentType')}
            value={paymentTypeLabel(renter.payment_type)}
            iconColor={colors.primary}
            secondaryColor={colors.textSecondary}
          />
        )}
        {renter.number_of_payments != null && (
          <IconDetailRow
            icon="hash"
            label={t('renter.numberOfPayments')}
            value={String(renter.number_of_payments)}
            iconColor={colors.primary}
            secondaryColor={colors.textSecondary}
          />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionHeaderText: {
    fontWeight: '600',
  },
  cardContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  leaseYearsScroll: {
    maxHeight: 220,
  },
  leaseYearRow: {
    paddingVertical: spacing.xs,
  },
  leaseYearLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leaseYearLabelWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaseYearValue: {
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 0,
  },
});
