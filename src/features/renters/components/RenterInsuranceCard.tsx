import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import { darkColors, lightColors } from '@/src/core/theme';
import { DetailRow, DetailSection } from '@/src/shared/components/ui';
import { formatMoney } from '@/src/shared/utils/money';
import type { Renter } from '@/src/shared/types';

interface RenterInsuranceCardProps {
  renter: Renter;
  insuranceTypeLabel: (type: string) => string;
}

export function RenterInsuranceCard({ renter, insuranceTypeLabel }: RenterInsuranceCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <DetailSection title={t('renter.insuranceType')}>
      {renter.insurance_type != null && renter.insurance_type !== '' && (
        <DetailRow
          // Kept: the shield says "this is cover", which the label alone does not.
          icon="shield-check"
          iconColor={colors.textSecondary}
          label={t('renter.insuranceType')}
          value={insuranceTypeLabel(renter.insurance_type)}
        />
      )}
      {renter.insurance_amount != null && (
        <DetailRow
          label={t('renter.insuranceAmount')}
          value={formatMoney(renter.insurance_amount)}
        />
      )}
    </DetailSection>
  );
}
