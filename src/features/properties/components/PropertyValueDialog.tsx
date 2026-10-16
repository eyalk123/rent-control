import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Dialog, HelperText, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { formatDateFull, toISODate } from '@/src/shared/utils/dates';
import { currencySymbol } from '@/src/shared/utils/money';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import type { PropertyValuationInput } from '@/src/shared/types';

interface Props {
  visible: boolean;
  loading?: boolean;
  onConfirm: (valuation: PropertyValuationInput) => void;
  onDismiss: () => void;
}

/**
 * One new entry for a property's value history: an amount and the date it is true as of.
 *
 * The same dialog behind the "+" in the property form and on the property screen. The form
 * keeps the entry and sends it with the save; the screen posts it straight away.
 */
export function PropertyValueDialog({ visible, loading, onConfirm, onDismiss }: Props) {
  const { t, i18n: { language } } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [touched, setTouched] = useState(false);

  // Reset on each open so a cancelled attempt doesn't pre-fill the next one.
  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setDate(new Date());
    setPickerOpen(false);
    setTouched(false);
  }, [visible]);

  const value = Number(amount.trim());
  const amountInvalid = amount.trim() === '' || Number.isNaN(value) || value <= 0;

  const submit = () => {
    setTouched(true);
    if (amountInvalid) return;
    onConfirm({ value, valued_on: toISODate(date) });
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={loading ? undefined : onDismiss}
        style={[styles.dialog, { backgroundColor: colors.inputFilledBackground }]}
      >
        <Dialog.Title style={{ color: colors.textPrimary }}>
          {t('property.valueDialogTitle')}
        </Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            {t('property.valueDialogNote')}
          </Text>

          <View>
            <TextInput
              mode="outlined"
              label={`${t('property.valueAmount')} (${currencySymbol()})`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              error={touched && amountInvalid}
              autoFocus
            />
            {touched && amountInvalid ? (
              <HelperText type="error" visible>
                {t('property.valueMustBePositive')}
              </HelperText>
            ) : null}
          </View>

          <View>
            <Text variant="labelMedium" style={{ color: colors.textPrimary }}>
              {t('property.valueDate')}
            </Text>
            <Pressable
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`${t('property.valueDate')}: ${formatDateFull(date, language)}`}
              style={[
                styles.dateBox,
                { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground },
              ]}
            >
              <Text style={{ color: colors.textPrimary }}>{formatDateFull(date, language)}</Text>
            </Pressable>
          </View>

          {pickerOpen && (
            <DateTimePicker
              value={date}
              mode="date"
              // The server refuses a future date: it would read as the current value until
              // that day came.
              maximumDate={new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_event, selected) => {
                // Android's dialog closes itself on any action; iOS's spinner stays open.
                if (Platform.OS !== 'ios') setPickerOpen(false);
                if (selected) setDate(selected);
              }}
            />
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button mode="contained" loading={loading} disabled={loading} onPress={submit}>
            {t('property.addValue')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  // Pinned by hand like every other dialog: Paper's default radius at this theme's
  // roundness comes out at 112.
  dialog: {
    borderRadius: 16,
  },
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
