import React, { useEffect, useState } from 'react';
import { Keyboard, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, radii, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui/Icon';
import { LeaseYearAmountField } from '@/src/shared/components/form/LeaseYearAmountField';
import { formatMoney } from '@/src/shared/utils/money';

/** Past this distance from the index figure the amount gets a second look, not a refusal. */
const FAR_FROM_INDEX = 0.05;

interface CpiAmountSheetProps {
  visible: boolean;
  renterName: string;
  /** The rent being paid now. */
  oldAmount: number;
  /** What the index linkage came to for the new year. */
  calculatedAmount: number;
  /** Already formatted for display. */
  effectiveDate: string;
  onCancel: () => void;
  /** Rejects to keep the sheet open; the caller reports the error. */
  onSave: (amount: number) => Promise<void>;
}

/** The round figures an owner usually agrees instead of the exact index result. */
function roundingOptions(calculated: number): number[] {
  const options = [Math.round(calculated / 50) * 50, Math.round(calculated / 100) * 100];
  return [...new Set(options)].filter((v) => v > 0 && v !== calculated);
}

function parseAmount(text: string): number | null {
  const n = Number(text.replace(',', '.').trim());
  return text.trim() !== '' && Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Edits the new rent from a confirmed CPI rent-change alert — usually to round it. One
 * field, prefilled with the index figure, with the nearby round numbers one tap away. A
 * sheet rather than a screen: it is a single number, and the alert stays in view behind it.
 *
 * Warnings never block. The owner knows what was agreed with the tenant; the sheet only
 * points out an amount below today's rent or far from the index, in case it is a typo.
 */
export function CpiAmountSheet({
  visible, renterName, oldAmount, calculatedAmount, effectiveDate, onCancel, onSave,
}: CpiAmountSheetProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(String(calculatedAmount));
  const [saving, setSaving] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // A fresh start each time it opens, from the figure of the alert it opened for.
  useEffect(() => {
    if (visible) setValue(String(calculatedAmount));
  }, [visible, calculatedAmount]);

  // Same lift as FilterBottomSheet: a transparent Modal does not resize for the keyboard
  // on Android, so the field would sit under it.
  useEffect(() => {
    if (!visible) {
      setKeyboardOffset(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardOffset(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOffset(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const amount = parseAmount(value);
  const belowCurrent = amount !== null && amount < oldAmount;
  const farFromIndex =
    amount !== null && calculatedAmount > 0 &&
    Math.abs(amount - calculatedAmount) / calculatedAmount > FAR_FROM_INDEX;

  const dismiss = () => {
    if (saving) return;
    Keyboard.dismiss();
    onCancel();
  };

  const save = async () => {
    if (amount === null || saving) return;
    Keyboard.dismiss();
    setSaving(true);
    try {
      await onSave(amount);
    } catch {
      // The caller has said what went wrong; stay open so nothing typed is lost.
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss}>
      <Pressable style={[StyleSheet.absoluteFillObject, styles.backdrop]} onPress={dismiss} />
      <View style={[styles.container, { marginBottom: keyboardOffset }]} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.dark ? darkColors.surfaceElevated : colors.surface,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.outline }]} />
          </View>

          <View style={styles.header}>
            <Text variant="titleMedium" style={[styles.title, { color: colors.textPrimary }]}>
              {t('notifications.cpiSheetTitle', { name: renterName })}
            </Text>
            <Pressable
              onPress={dismiss}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              style={[styles.closeBtn, { backgroundColor: colors.controlFill }]}
            >
              <Icon name="x" size={16} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.body}>
            <Text style={[styles.context, { color: colors.textSecondary }]}>
              {t('notifications.cpiSheetCalculated', {
                amount: formatMoney(calculatedAmount),
                old: formatMoney(oldAmount),
                date: effectiveDate,
              })}
            </Text>

            <Text style={[styles.label, { color: colors.fieldLabel }]}>
              {t('notifications.cpiSheetAmountLabel')}
            </Text>
            <LeaseYearAmountField value={value} onChangeText={setValue} />

            <View style={styles.chips}>
              {roundingOptions(calculatedAmount).map((option) => {
                const selected = amount === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setValue(String(option))}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.chip,
                      selected
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.controlFill },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selected ? colors.onPrimary : colors.textPrimary },
                      ]}
                    >
                      {formatMoney(option)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {belowCurrent && (
              <Text style={[styles.warning, { color: colors.error }]}>
                {t('notifications.cpiSheetWarnBelowCurrent', { amount: formatMoney(oldAmount) })}
              </Text>
            )}
            {farFromIndex && (
              <Text style={[styles.warning, { color: colors.error }]}>
                {t('notifications.cpiSheetWarnFarFromIndex')}
              </Text>
            )}

            <Text style={[styles.helper, { color: colors.textSecondary }]}>
              {t('notifications.cpiSheetHelper')}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button onPress={dismiss} disabled={saving} textColor={colors.textSecondary}>
              {t('common.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={save}
              loading={saving}
              disabled={amount === null || saving}
              style={styles.saveButton}
            >
              {t('common.save')}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingTop: spacing.xs,
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  context: {
    fontSize: 13,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warning: {
    fontSize: 13,
  },
  helper: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  saveButton: {
    minWidth: 96,
  },
});
