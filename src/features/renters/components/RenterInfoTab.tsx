import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getCurrentMonthlyRent, getLeaseEndDate, type Renter } from '@/src/shared/types';
import { getEffectiveLeaseEnd, isOpenEnded } from '@/src/shared/utils/renterStatus';
import { darkColors, lightColors, spacing, ICON_SM, useEntityColor } from '@/src/core/theme';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import { PropertyThumb } from '@/src/features/properties/components/PropertyThumb';
import { useLanguageContext } from '@/src/core/context';
import { formatMoney } from '@/src/shared/utils/money';
import { formatDateFull, parseISODate } from '@/src/shared/utils/dates';
import { getPaymentMethodLabel } from '@/src/shared/constants/paymentMethods';
import {
  ContactActionsRow,
  DetailRow,
  DetailSection,
  DocumentsCard,
  Icon,
  SectionLabel,
  StatBox,
} from '@/src/shared/components/ui';
import { RenterExtraContactsCard } from './RenterExtraContactsCard';
import { RenterLeaseInfoDisplayCard } from './RenterLeaseInfoDisplayCard';
import { RenterInsuranceCard } from './RenterInsuranceCard';
import { OptionYearCard } from '@/src/features/renters/components/OptionYearCard';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';

interface RenterInfoTabProps {
  renter: Renter;
  onExerciseOption: () => void;
}

export function RenterInfoTab({ renter, onExerciseOption }: RenterInfoTabProps) {
  const { t, i18n: { language } } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const itemColor = useEntityColor(renter.color);
  const monthlyRent = getCurrentMonthlyRent(renter);
  // Same rule as the renters list: an open-ended lease's end date is one the server keeps
  // rolling forward, so it is named rather than printed.
  const leaseEnd = getEffectiveLeaseEnd(renter) ?? getLeaseEndDate(renter);
  const leaseEndValue = isOpenEnded(renter)
    ? t('renter.openEndedShort')
    : leaseEnd
      ? formatDateFull(leaseEnd, language)
      : '–';

  const insuranceTypeLabel = (insuranceType: string) => {
    switch (insuranceType) {
      case 'wire_transfer': return t('renter.insuranceTypeWireTransfer');
      case 'bank_guarantee': return t('renter.insuranceTypeBankGuarantee');
      default: return insuranceType;
    }
  };

  const paymentTypeLabel = (paymentType: string) => getPaymentMethodLabel(paymentType, t);

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
      <ContactActionsRow phone={renter.phone} email={renter.email} raised style={{ marginBottom: spacing.lg }} />

      <View style={styles.statsRow}>
        <StatBox
          value={monthlyRent > 0 ? formatMoney(monthlyRent) : '–'}
          label={t('renter.monthlyRent')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.primary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
        <StatBox
          value={renter.lease_start ? formatDateFull(parseISODate(renter.lease_start)!, language) : '–'}
          label={t('renter.dateOfStart')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.secondary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
        {/* Lease end rather than payment frequency: frequency is repeated in the lease card
            below, and the end date is the one thing an owner opens a renter to check. */}
        <StatBox
          value={leaseEndValue}
          label={t('renter.leaseEndsCaption')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.sectionAccent}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
      </View>

      <OptionYearCard renter={renter} onExercise={onExerciseOption} />

      <LivesAtCard renter={renter} />

      {renter.extra_contacts && renter.extra_contacts.length > 0 && (
        <RenterExtraContactsCard contacts={renter.extra_contacts} />
      )}

      <TourAnchor id={ANCHORS.renterDetailTimeline}>
        <RenterLeaseInfoDisplayCard
          renter={renter}
          paymentTypeLabel={paymentTypeLabel}
          currentYearColor={itemColor.bg}
        />
      </TourAnchor>

      <DetailSection title={t('renter.contactSection')}>
        {renter.phone ? <DetailRow label={t('renter.phone')} value={renter.phone} /> : null}
        {renter.email ? <DetailRow label={t('renter.email')} value={renter.email} /> : null}
      </DetailSection>

      <DocumentsCard documents={documents} />

      {hasInsurance && (
        <RenterInsuranceCard renter={renter} insuranceTypeLabel={insuranceTypeLabel} />
      )}
    </ScrollView>
  );
}

/**
 * Where the renter lives, as a card in the property's own color that opens the property -
 * the counterpart of "Renters here" on the property screen.
 */
function LivesAtCard({ renter }: { renter: Renter }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const property = renter.property;
  if (!property) return null;
  const address = `${property.address}${formatFloorApartment(property, t)}`;

  return (
    <View style={styles.livesAt}>
      <SectionLabel title={t('renter.livesAt')} />
      <TouchableOpacity
        onPress={() => router.push(`/properties/${property.id}` as any)}
        accessibilityRole="button"
        accessibilityLabel={address}
        style={[styles.livesAtCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
      >
        <PropertyThumb property={property} width={56} height={42} />
        <View style={styles.livesAtText}>
          <Text variant="bodyMedium" numberOfLines={1} style={[styles.livesAtAddress, { color: colors.textPrimary }]}>
            {address}
          </Text>
          <Text variant="labelSmall" numberOfLines={1} style={{ color: colors.textSecondary }}>
            {property.city}
          </Text>
        </View>
        <Icon name={isRtl ? 'chevron-left' : 'chevron-right'} size={ICON_SM} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  livesAt: {
    marginBottom: spacing.lg,
  },
  livesAtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  livesAtText: {
    flex: 1,
    minWidth: 0,
  },
  livesAtAddress: {
    fontWeight: '500',
  },
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
