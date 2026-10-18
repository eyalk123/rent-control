import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { isRtlLanguage } from '@/src/core/i18n';
import { useAlert } from '@/src/core/context';
import { useRenterContext } from '@/src/context';
import { getApiErrorMessage } from '@/src/core/api/client';
import { updateRenter } from '@/src/features/renters/api/renters';
import { getLeaseEndDate, type Renter } from '@/src/shared/types';
import { exerciseNextOption } from '@/src/shared/utils/leaseSchedule';
import { leaseYearStart } from '@/src/shared/utils/leaseYear';
import { formatDateFull } from '@/src/shared/utils/dates';
import { formatMoney } from '@/src/shared/utils/money';

interface Props {
  /** Null while closed — the alert rows open it for whichever renter was tapped. */
  renter: Renter | null;
  onDismiss: () => void;
  /** The PATCH echoes the updated renter, so a screen holding one can refresh from it. */
  onSaved?: (renter: Renter) => void;
  /** "Change terms instead": the renewal came with a different rent, so open Extend. */
  onChangeTerms: () => void;
}

/**
 * One-step "the tenant took the option": flips the next option year to a contract year and
 * saves. Amount, rule and length stay as signed — a renewal on different terms is what
 * "Change terms instead" (the Extend screen) is for. The contract end moves out by that
 * year, which is also what clears the lease-expiring alert.
 */
export function ExerciseOptionDialog({ renter, onDismiss, onSaved, onChangeTerms }: Props) {
  const { t, i18n: { language } } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { appAlert } = useAlert();
  const { refreshRenters } = useRenterContext();
  const [saving, setSaving] = useState(false);
  const isRtl = isRtlLanguage(language);
  // Same as the app's own alert dialog: "auto", not "right", because under forceRTL React
  // Native mirrors left/right and "right" lands Hebrew on the left edge.
  const rtlText = {
    textAlign: isRtl ? ('auto' as const) : ('left' as const),
    writingDirection: isRtl ? ('rtl' as const) : ('ltr' as const),
  };

  const exercised = renter ? exerciseNextOption(renter.lease_years) : null;
  if (!renter || !exercised) return null;

  const start = leaseYearStart(renter.lease_start, renter.lease_years, exercised.index);
  const newEnd = getLeaseEndDate({ ...renter, lease_years: exercised.leaseYears });

  const handleConfirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      const updated = await updateRenter(renter.id, {
        lease_years: exercised.leaseYears,
        ...exercised.intent,
      });
      await refreshRenters();
      onSaved?.(updated);
      onDismiss();
    } catch (err) {
      appAlert(t('error.title'), getApiErrorMessage(err, t('error.saveRenterFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Dialog
        visible
        onDismiss={saving ? undefined : onDismiss}
        style={[styles.dialog, { backgroundColor: colors.inputFilledBackground }]}
      >
        <Dialog.Title style={[rtlText, { color: colors.textPrimary }]}>
          {t('renter.exerciseOptionTitle', { name: `${renter.first_name} ${renter.last_name}` })}
        </Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodyMedium" style={[rtlText, { color: colors.textSecondary }]}>
            {t('renter.exerciseOptionBody', {
              start: start ? formatDateFull(start, language) : '–',
              amount: formatMoney(renter.lease_years[exercised.index].amount),
              date: newEnd ? formatDateFull(newEnd, language) : '–',
            })}
          </Text>
          <Button
            mode="text"
            compact
            disabled={saving}
            onPress={onChangeTerms}
            style={styles.changeTerms}
          >
            {t('renter.exerciseOptionChangeTerms')}
          </Button>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={saving} textColor={colors.textSecondary}>
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            loading={saving}
            disabled={saving}
            onPress={handleConfirm}
            style={styles.button}
          >
            {t('renter.exerciseOption')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  // Pinned by hand like every other dialog here: Paper's default radius is `roundness * 7`,
  // which this theme's roundness of 16 turns into a squircle.
  dialog: {
    borderRadius: 16,
  },
  content: {
    gap: spacing.sm,
  },
  // The start edge in both directions: the layout is mirrored under RTL.
  changeTerms: {
    alignSelf: 'flex-start',
  },
  // The app's button radius; Paper's own, at this theme's roundness, is a pill.
  button: {
    borderRadius: 12,
  },
});
