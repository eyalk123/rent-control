import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DropdownField, type DropdownItem } from '@/src/shared/components/form';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';
import { useLanguageContext } from '@/src/core/context';
import { sortOptions } from '@/src/shared/utils/sortOptions';
import type { Supplier } from '@/src/shared/types';

interface SupplierPickerProps {
  /** Every active supplier (`useSuppliers`). */
  suppliers: Supplier[];
  /** Refetch them — called when the screen regains focus, e.g. back from adding one. */
  onReload: () => void;
  categoryIds: number[];
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  required?: boolean;
  inputStyle?: StyleProp<ViewStyle>;
  allowNone?: boolean;
  /** Shows a "New supplier" link under the field. The new supplier is not preselected. */
  onAddSupplier?: () => void;
  /** RHF field name, set when a scanned receipt may have filled this field. */
  reviewName?: string;
  /** The supplier's name as a scanned receipt wrote it, shown while none is picked — the
   *  scan matched no supplier, and this tells the user who to pick or add. */
  readOnReceipt?: string | null;
}

/**
 * Every supplier, the ones who work in a chosen category first. Nothing is hidden and the
 * category no longer gates the field: a supplier outside the chosen categories is allowed,
 * and the expense screen warns about it on save — the same rule as the web form.
 */
export function SupplierPicker({
  suppliers,
  onReload,
  categoryIds,
  value,
  onChange,
  label,
  required,
  inputStyle,
  allowNone = true,
  onAddSupplier,
  reviewName,
  readOnReceipt,
}: SupplierPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();

  // Coming back from the add-supplier screen: refetch so a supplier just saved shows up.
  // The first focus is the mount, which fetches anyway.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) onReload();
      focusedOnce.current = true;
    }, [onReload]),
  );

  const data = useMemo<DropdownItem<number | null>[]>(() => {
    const works = (s: Supplier) => s.category_ids?.some((cid) => categoryIds.includes(cid)) ?? false;
    const toItem = (s: Supplier) => ({ label: s.name, value: s.id });
    const items = [
      ...sortOptions(suppliers.filter(works).map(toItem), language),
      ...sortOptions(suppliers.filter((s) => !works(s)).map(toItem), language),
    ];
    return allowNone
      ? [{ label: t('transactions.noSupplier'), value: null, pinned: true }, ...items]
      : items;
  }, [allowNone, categoryIds, suppliers, t, language]);

  return (
    <View>
      <DropdownField
        required={required}
        data={data}
        value={value}
        onChange={onChange}
        label={label ?? t('transactions.supplier', { defaultValue: 'Supplier' })}
        inputStyle={inputStyle}
        reviewName={reviewName}
        // Already in order: matching suppliers first, each group alphabetical.
        sorted={false}
      />
      {value == null && readOnReceipt ? (
        <Text variant="bodySmall" style={[styles.readAs, { color: colors.textSecondary }]}>
          {t('transactions.receiptScan.readAs', { name: readOnReceipt })}
        </Text>
      ) : null}
      {onAddSupplier && (
        <TouchableOpacity
          style={styles.addLink}
          onPress={onAddSupplier}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <Text variant="labelLarge" style={{ color: colors.primary }}>
            {t('transactions.newSupplier')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readAs: {
    marginTop: -8,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingTop: 6,
  },
});
