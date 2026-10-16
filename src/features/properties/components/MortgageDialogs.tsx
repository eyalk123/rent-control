import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Dialog, HelperText, IconButton, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { formatDateFull, toISODate } from '@/src/shared/utils/dates';
import { currencySymbol, formatDate, formatMoney } from '@/src/shared/utils/money';
import { darkColors, lightColors, spacing, ICON_SM } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';
import type { Mortgage, MortgagePaymentInput } from '@/src/shared/types';

const amountValid = (raw: string) => raw.trim() !== '' && !Number.isNaN(Number(raw.trim())) && Number(raw.trim()) > 0;

/** A tappable date box that opens the platform picker — the value dialog's control. */
function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
}) {
  const { i18n: { language } } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [open, setOpen] = useState(false);
  const shown = formatDateFull(value, language);
  return (
    <View>
      <Text variant="labelMedium" style={{ color: colors.textPrimary }}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${shown}`}
        style={[styles.dateBox, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}
      >
        <Text style={{ color: colors.textPrimary }}>{shown}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_event, selected) => {
            // Android's dialog closes itself on any action; iOS's spinner stays open.
            if (Platform.OS !== 'ios') setOpen(false);
            if (selected) onChange(selected);
          }}
        />
      )}
    </View>
  );
}

interface PaymentDialogProps {
  visible: boolean;
  loading?: boolean;
  onConfirm: (data: MortgagePaymentInput) => void;
  onDismiss: () => void;
}

/** A new monthly amount from a date on — what the owner does after a rate change. */
export function MortgagePaymentDialog({ visible, loading, onConfirm, onDismiss }: PaymentDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date());
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setDate(new Date());
    setTouched(false);
  }, [visible]);

  const amountInvalid = !amountValid(amount);
  const submit = () => {
    setTouched(true);
    // Any date: a change the bank has announced for next month is worth recording now.
    if (amountInvalid) return;
    onConfirm({ amount: Number(amount.trim()), effective_from: toISODate(date) });
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={loading ? undefined : onDismiss}
        style={[styles.dialog, { backgroundColor: colors.inputFilledBackground }]}
      >
        <Dialog.Title style={{ color: colors.textPrimary }}>{t('mortgage.newPaymentTitle')}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{t('mortgage.newPaymentNote')}</Text>
          <View>
            <TextInput
              mode="outlined"
              label={`${t('mortgage.monthlyPayment')} (${currencySymbol()})`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              error={touched && amountInvalid}
              autoFocus
            />
            {touched && amountInvalid ? (
              <HelperText type="error" visible>{t('mortgage.amountInvalid')}</HelperText>
            ) : null}
          </View>
          <DateField label={t('mortgage.paymentFrom')} value={date} onChange={setDate} />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>{t('common.cancel')}</Button>
          <Button mode="contained" loading={loading} disabled={loading} onPress={submit}>
            {t('mortgage.newPayment')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

interface HistoryDialogProps {
  mortgage: Mortgage | null;
  onDelete: (paymentId: number) => void;
  onDismiss: () => void;
}

/** Every amount the mortgage has had, newest first. Each is removable but the last. */
export function MortgagePaymentHistoryDialog({ mortgage, onDelete, onDismiss }: HistoryDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const payments = mortgage?.payments ?? [];
  const only = payments.length <= 1;

  return (
    <Portal>
      <Dialog
        visible={mortgage != null}
        onDismiss={onDismiss}
        style={[styles.dialog, styles.tall, { backgroundColor: colors.inputFilledBackground }]}
      >
        <Dialog.Title style={{ color: colors.textPrimary }}>{t('mortgage.history')}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView contentContainerStyle={styles.list}>
            {payments.map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.row,
                  i < payments.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.inputBorder,
                  },
                ]}
              >
                <Text variant="bodyMedium" style={[styles.date, { color: colors.textSecondary }]}>
                  {formatDate(p.effective_from)}
                </Text>
                <Text variant="bodyMedium" style={[styles.amount, { color: colors.textPrimary }]}>
                  {formatMoney(p.amount)}
                </Text>
                <IconButton
                  icon={() => <Icon name="trash" size={ICON_SM} color={colors.textSecondary} />}
                  onPress={() => onDelete(p.id)}
                  disabled={only}
                  accessibilityLabel={t('mortgage.deletePayment')}
                />
              </View>
            ))}
            {only ? (
              <Text variant="bodySmall" style={[styles.note, { color: colors.textSecondary }]}>
                {t('mortgage.lastPayment')}
              </Text>
            ) : null}
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>{t('common.close')}</Button>
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
  tall: {
    maxHeight: '80%',
  },
  content: {
    gap: spacing.sm,
  },
  dateBox: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    flex: 1,
  },
  amount: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  note: {
    paddingVertical: spacing.sm,
  },
});
