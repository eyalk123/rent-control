import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getCurrentMonthlyRent, type Renter } from '@/src/shared/types';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import {
  ContactActionsRow,
  DocumentsCard,
  StatBox,
} from '@/src/shared/components/ui';
import { RenterExtraContactsCard } from './RenterExtraContactsCard';
import { RenterLeaseInfoDisplayCard } from './RenterLeaseInfoDisplayCard';
import { RenterInsuranceCard } from './RenterInsuranceCard';

interface RenterInfoTabProps {
  renter: Renter;
}

export function RenterInfoTab({ renter }: RenterInfoTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const monthlyRent = getCurrentMonthlyRent(renter);

  const insuranceTypeLabel = (insuranceType: string) => {
    switch (insuranceType) {
      case 'wire_transfer': return t('renter.insuranceTypeWireTransfer');
      case 'bank_guarantee': return t('renter.insuranceTypeBankGuarantee');
      default: return insuranceType;
    }
  };

  const paymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'bank_transfer': return t('renter.paymentTypeWireTransfer');
      case 'cash': return t('renter.paymentTypeCash');
      case 'bit': return t('renter.paymentTypeBit');
      case 'check': return t('transactions.paymentMethodCheck');
      default: return paymentType;
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

  const documents = [
    renter.full_contract_url
      ? { label: t('documents.fullContract'), url: renter.full_contract_url, icon: 'file-text' as const }
      : null,
    renter.id_image_url
      ? { label: t('documents.idImage'), url: renter.id_image_url, icon: 'contact' as const }
      : null,
  ].filter(Boolean) as { label: string; url: string; icon: 'file-text' | 'contact' }[];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ContactActionsRow phone={renter.phone} email={renter.email} style={{ marginBottom: spacing.lg }} />

      <View style={styles.statsRow}>
        <StatBox
          icon="wallet"
          value={monthlyRent > 0 ? formatMoney(monthlyRent) : '—'}
          label={t('renter.monthlyRent')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.primary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
        <StatBox
          icon="calendar"
          value={renter.lease_start ? formatDate(renter.lease_start) : '—'}
          label={t('renter.dateOfStart')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.secondary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
        <StatBox
          icon="credit-card"
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

      {renter.extra_contacts && renter.extra_contacts.length > 0 && (
        <RenterExtraContactsCard contacts={renter.extra_contacts} />
      )}

      <RenterLeaseInfoDisplayCard renter={renter} paymentTypeLabel={paymentTypeLabel} />

      <DocumentsCard documents={documents} />

      {hasInsurance && (
        <RenterInsuranceCard renter={renter} insuranceTypeLabel={insuranceTypeLabel} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
});
