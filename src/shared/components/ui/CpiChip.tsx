import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { indexLabelKey } from '@/src/shared/utils/indexLabels';
import { Icon } from './Icon';

type CpiChipProps = {
  /**
   * Row direction for icon + label. The lease-year editors pass their own, because the two
   * screens derive it differently under forced RTL; elsewhere the default follows the
   * writing direction.
   */
  flexDirection?: ViewStyle['flexDirection'];
  style?: StyleProp<ViewStyle>;
};

/**
 * Marks a rent amount as index-linked and not yet settled — the country's index name
 * ("CPI" / "מדד") beside a trending-up icon. Shared by the lease-year editor and the renter
 * detail card so an estimate looks the same wherever it appears.
 */
export const CpiChip = React.memo(function CpiChip({ flexDirection = 'row', style }: CpiChipProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  return (
    <View
      style={[styles.chip, { backgroundColor: colors.inputFilledBackground, flexDirection }, style]}
    >
      <Icon name="trending-up" size={12} color={colors.textSecondary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{t(indexLabelKey())}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  text: { fontSize: 11, fontWeight: '700' },
});
