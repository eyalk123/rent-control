import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Dialog, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { getLeaseEndDate, type Renter } from '@/src/shared/types';

interface Props {
  visible: boolean;
  renter: Renter;
  loading?: boolean;
  onConfirm: (terminatedOn: string, reason: string | null) => void;
  onDismiss: () => void;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Closing a lease early.
 *
 * Deliberately not a destructive-styled dialog: ending a tenancy is an ordinary lifecycle
 * event, and dressing it up like Delete would push people back to shortening the lease
 * term by hand — the destructive path this exists to replace.
 */
export function EndLeaseDialog({ visible, renter, loading, onConfirm, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const [date, setDate] = useState(() => new Date());
  const [reason, setReason] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  // Reset on each open so a cancelled attempt doesn't pre-fill the next one.
  useEffect(() => {
    if (!visible) return;
    setDate(new Date());
    setReason('');
    setPickerOpen(false);
  }, [visible]);

  // The same bounds the server enforces, so an invalid date is caught before the round
  // trip rather than coming back as a 400.
  const minDate = renter.lease_start ? new Date(renter.lease_start) : undefined;
  const maxDate = getLeaseEndDate(renter) ?? undefined;

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={loading ? undefined : onDismiss}
        style={{ backgroundColor: colors.inputFilledBackground }}
      >
        <Dialog.Title style={{ color: colors.textPrimary }}>
          {t('renter.endLeaseTitle')}
        </Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            {t('renter.endLeaseNote')}
          </Text>

          <View>
            <Text variant="labelMedium" style={{ color: colors.textPrimary }}>
              {t('renter.endLeaseDateLabel')}
            </Text>
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={[
                styles.dateBox,
                { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground },
              ]}
            >
              <Text style={{ color: colors.textPrimary }}>
                {date.toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </Pressable>
          </View>

          {pickerOpen && (
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={minDate}
              maximumDate={maxDate}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event, selected) => {
                // Android's dialog closes itself on any action; iOS's spinner stays open.
                if (Platform.OS !== 'ios') setPickerOpen(false);
                if (selected) setDate(selected);
              }}
            />
          )}

          <TextInput
            mode="outlined"
            label={t('renter.endLeaseReasonLabel')}
            value={reason}
            onChangeText={setReason}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            mode="contained"
            loading={loading}
            disabled={loading}
            onPress={() => onConfirm(toISODate(date), reason.trim() || null)}
          >
            {t('renter.endLeaseConfirm')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  dateBox: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
