import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { IconDetailRow } from '@/src/shared/components/ui/IconDetailRow';
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
    <Card style={styles.card} mode="outlined">
      <View style={[styles.sectionHeader, { backgroundColor: colors.sectionAccent }]}>
        <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: colors.onPrimary }]}>
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
            icon="lock"
            label={t('renter.insuranceAmount')}
            value={formatMoney(renter.insurance_amount)}
            iconColor={colors.sectionAccent}
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
});
