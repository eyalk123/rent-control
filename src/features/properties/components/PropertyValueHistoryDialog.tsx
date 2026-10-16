import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, IconButton, Portal, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/src/core/context';
import { getApiErrorMessage } from '@/src/core/api/client';
import {
  deletePropertyValuation,
  getPropertyValuations,
} from '@/src/features/properties/api/properties';
import { formatDate, formatMoney } from '@/src/shared/utils/money';
import { darkColors, lightColors, spacing, ICON_SM } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';
import type { PropertyValuation } from '@/src/shared/types';
import { PropertyValueChart } from '@/src/features/properties/components/PropertyValueChart';

interface Props {
  visible: boolean;
  propertyId: number;
  /** Drawn as the chart's first point when both are known. */
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  onDismiss: () => void;
  /** After a value is removed, so the screen can refresh the property's current value. */
  onChanged: () => void;
}

/** Every value recorded for the property, newest first, each removable. */
export function PropertyValueHistoryDialog({
  visible,
  propertyId,
  purchasePrice,
  purchaseDate,
  onDismiss,
  onChanged,
}: Props) {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [valuations, setValuations] = useState<PropertyValuation[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setValuations(null);
    setFailed(false);
    getPropertyValuations(propertyId)
      .then(setValuations)
      .catch(() => setFailed(true));
  }, [visible, propertyId]);

  const remove = (entry: PropertyValuation) => {
    appAlert(t('property.deleteValueConfirm'), `${formatMoney(entry.value)} · ${formatDate(entry.valued_on)}`, [
      { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
      {
        text: t('common.remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePropertyValuation(propertyId, entry.id);
            setValuations((prev) => prev?.filter((v) => v.id !== entry.id) ?? null);
            onChanged();
          } catch (err) {
            appAlert(t('error.title'), getApiErrorMessage(err, t('error.saveFailed')));
          }
        },
      },
    ]);
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onDismiss}
        style={[styles.dialog, { backgroundColor: colors.inputFilledBackground }]}
      >
        <Dialog.Title style={{ color: colors.textPrimary }}>{t('property.valueHistory')}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView contentContainerStyle={styles.list}>
            {valuations == null && !failed ? (
              <ActivityIndicator style={styles.loading} />
            ) : failed ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('error.loadFailed')}</Text>
            ) : valuations!.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                {t('property.noValueHistory')}
              </Text>
            ) : (
              <>
              <PropertyValueChart
                valuations={valuations!}
                purchasePrice={purchasePrice}
                purchaseDate={purchaseDate}
              />
              {valuations!.map((v, i) => (
                <View
                  key={v.id}
                  style={[
                    styles.row,
                    i < valuations!.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.inputBorder,
                    },
                  ]}
                >
                  <Text variant="bodyMedium" style={[styles.date, { color: colors.textSecondary }]}>
                    {formatDate(v.valued_on)}
                  </Text>
                  <Text variant="bodyMedium" style={[styles.amount, { color: colors.textPrimary }]}>
                    {formatMoney(v.value)}
                  </Text>
                  <IconButton
                    icon={() => <Icon name="trash" size={ICON_SM} color={colors.textSecondary} />}
                    onPress={() => remove(v)}
                    accessibilityLabel={t('property.deleteValue')}
                  />
                </View>
              ))}
              </>
            )}
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
  dialog: {
    borderRadius: 16,
    maxHeight: '80%',
  },
  scrollArea: {
    paddingHorizontal: 0,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  loading: {
    paddingVertical: spacing.lg,
  },
  empty: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
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
});
