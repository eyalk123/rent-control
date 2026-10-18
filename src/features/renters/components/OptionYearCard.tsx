import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, ICON_MD, lightColors, spacing } from '@/src/core/theme';
import { isRtlLanguage } from '@/src/core/i18n';
import { Icon } from '@/src/shared/components/ui/Icon';
import type { Renter } from '@/src/shared/types';
import { nextOptionIndex } from '@/src/shared/utils/leaseSchedule';
import { leaseYearStart } from '@/src/shared/utils/leaseYear';
import { isOptionDecisionDue } from '@/src/shared/utils/renterStatus';
import { formatDateFull } from '@/src/shared/utils/dates';
import { formatMoney } from '@/src/shared/utils/money';

interface Props {
  renter: Renter;
  onExercise: () => void;
}

/**
 * "The next option year is the owner's to confirm" — shown on the renter's info tab from a
 * month before it starts, so taking it up doesn't mean opening Extend and flipping a row by hand.
 */
export function OptionYearCard({ renter, onExercise }: Props) {
  const { t, i18n: { language } } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  if (!isOptionDecisionDue(renter)) return null;

  const isRtl = isRtlLanguage(language);
  // Text direction only: the row itself is mirrored under RTL already. "auto", not "right",
  // for the same reason as the app's alert dialog.
  const rtlText = {
    textAlign: isRtl ? ('auto' as const) : ('left' as const),
    writingDirection: isRtl ? ('rtl' as const) : ('ltr' as const),
  };
  const index = nextOptionIndex(renter.lease_years);
  const start = leaseYearStart(renter.lease_start, renter.lease_years, index);

  return (
    <View style={[styles.card, { backgroundColor: colors.inputBackground }]}>
      <Icon name="calendar-clock" size={ICON_MD} color={colors.primary} />
      <View style={styles.text}>
        <Text variant="titleSmall" style={[rtlText, { color: colors.textPrimary }]}>
          {t('renter.optionYearAvailable')}
        </Text>
        <Text variant="bodySmall" style={[rtlText, { color: colors.textSecondary }]}>
          {t('renter.optionYearAvailableDetail', {
            start: start ? formatDateFull(start, language) : '–',
            amount: formatMoney(renter.lease_years[index].amount),
          })}
        </Text>
      </View>
      <Button mode="contained" compact onPress={onExercise} style={styles.button}>
        {t('renter.exerciseOption')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  // The app's button radius; Paper's own, at this theme's roundness, is a pill.
  button: {
    borderRadius: 12,
  },
});
