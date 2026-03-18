import React from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { getRenterMonthlyRent, type Renter } from '@/src/shared/types';
import { lightColors, darkColors, spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';

interface RenterInfoTabProps {
  renter: Renter;
}

function ActionCircle({
  icon,
  label,
  backgroundColor,
  iconColor,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  backgroundColor: string;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCircleWrapper} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionCircle, { backgroundColor }]}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>
      <Text variant="labelSmall" style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatBox({
  icon,
  value,
  label,
  backgroundColor,
  iconColor,
  textColor,
  secondaryColor,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  label: string;
  backgroundColor: string;
  iconColor: string;
  textColor: string;
  secondaryColor: string;
}) {
  return (
    <View style={[styles.statBox, { backgroundColor }]}>
      <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      <Text variant="bodyLarge" style={[styles.statValue, { color: textColor }]}>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: secondaryColor }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function IconDetailRow({
  icon,
  label,
  value,
  iconColor,
  secondaryColor,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  iconColor: string;
  secondaryColor: string;
}) {
  return (
    <View style={styles.iconRow}>
      <View style={styles.iconRowLeft}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        <Text variant="bodyMedium" style={{ color: secondaryColor }}>
          {label}
        </Text>
      </View>
      <Text variant="bodyMedium" style={styles.iconRowValue}>
        {value}
      </Text>
    </View>
  );
}

export function RenterInfoTab({ renter }: RenterInfoTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const monthlyRent = getRenterMonthlyRent(renter);

  const insuranceTypeLabel = (insuranceType: string) => {
    switch (insuranceType) {
      case "wire_transfer":
        return t("renter.insuranceTypeWireTransfer");
      case "bank_guarantee":
        return t("renter.insuranceTypeBankGuarantee");
      default:
        return insuranceType;
    }
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const hasInsurance =
    (renter.insurance_type != null && renter.insurance_type !== '') ||
    renter.insurance_amount != null;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Contact action circles */}
      <View style={styles.actionsRow}>
        {renter.phone ? (
          <ActionCircle
            icon="phone"
            label={t('renter.call')}
            backgroundColor={colors.chooseRevenueBg}
            iconColor={colors.chooseRevenueIcon}
            onPress={() => Linking.openURL(`tel:${renter.phone}`)}
          />
        ) : null}
        {renter.phone ? (
          <ActionCircle
            icon="message-text"
            label={t('renter.sms')}
            backgroundColor="rgba(29, 78, 216, 0.15)"
            iconColor={colors.primary}
            onPress={() => Linking.openURL(`sms:${renter.phone}`)}
          />
        ) : null}
        {renter.email ? (
          <ActionCircle
            icon="email"
            label={t('renter.email')}
            backgroundColor="rgba(13, 148, 136, 0.15)"
            iconColor={colors.secondary}
            onPress={() => Linking.openURL(`mailto:${renter.email}`)}
          />
        ) : null}
      </View>

      {/* Stat boxes */}
      <View style={styles.statsRow}>
        <StatBox
          icon="cash"
          value={monthlyRent > 0 ? formatMoney(monthlyRent) : '—'}
          label={t('renter.monthlyRent')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.primary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
        <StatBox
          icon="calendar-start"
          value={renter.lease_start ? formatDate(renter.lease_start) : '—'}
          label={t('renter.dateOfStart')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.secondary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
        <StatBox
          icon="credit-card-outline"
          value={
            renter.number_of_payments != null
              ? String(renter.number_of_payments)
              : renter.payment_type || '—'
          }
          label={t('renter.numberOfPayments')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.sectionAccent}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
      </View>

      {/* Lease info card */}
      <Card style={styles.card} mode="outlined">
        <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
          <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: '#FFF' }]}>
            {t('renter.leaseInfo')}
          </Text>
        </View>
        <Card.Content style={styles.cardContent}>
          {renter.lease_years && renter.lease_years.length > 0
            ? renter.lease_years.map((year, idx) => (
                <IconDetailRow
                  key={idx}
                  icon="file-document-outline"
                  label={t('renter.leaseYearLabel', { year: idx + 1 })}
                  value={`${formatMoney(year.amount)} (${
                    year.type === 'contract'
                      ? t('renter.leaseYearTypeContract')
                      : t('renter.leaseYearTypeOption')
                  })`}
                  iconColor={colors.primary}
                  secondaryColor={colors.textSecondary}
                />
              ))
            : null}
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
              icon="bank-transfer"
              label={t('renter.paymentType')}
              value={renter.payment_type}
              iconColor={colors.primary}
              secondaryColor={colors.textSecondary}
            />
          )}
          {renter.number_of_payments != null && (
            <IconDetailRow
              icon="counter"
              label={t('renter.numberOfPayments')}
              value={String(renter.number_of_payments)}
              iconColor={colors.primary}
              secondaryColor={colors.textSecondary}
            />
          )}
        </Card.Content>
      </Card>

      {/* Insurance card */}
      {hasInsurance && (
        <Card style={styles.card} mode="outlined">
          <View style={[styles.sectionHeader, { backgroundColor: colors.sectionAccent }]}>
            <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: '#FFF' }]}>
              {t('renter.insuranceType')}
            </Text>
          </View>
          <Card.Content style={styles.cardContent}>
            {renter.insurance_type != null && renter.insurance_type !== '' && (
              <IconDetailRow
                icon="shield-check"
                label={t('renter.insuranceType')}
                value={insuranceTypeLabel(renter.insurance_type)}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
            {renter.insurance_amount != null && (
              <IconDetailRow
                icon="cash-lock"
                label={t('renter.insuranceAmount')}
                value={formatMoney(renter.insurance_amount)}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  actionCircleWrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    gap: 2,
  },
  statValue: {
    fontWeight: '700',
  },
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
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  iconRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  iconRowValue: {
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 0,
  },
});
