import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSuppliers } from '@/src/features/transactions/hooks/useTransactions';
import { DropdownField } from '@/src/shared/components/form';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';

interface SupplierPickerProps {
  categoryIds: number[];
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  required?: boolean;
  inputStyle?: StyleProp<ViewStyle>;
  allowNone?: boolean;
  /** Shows a "New supplier" link under the field. The new supplier is not preselected. */
  onAddSupplier?: () => void;
}

export function SupplierPicker({
  categoryIds,
  value,
  onChange,
  label,
  required,
  inputStyle,
  allowNone = true,
  onAddSupplier,
}: SupplierPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { suppliers, reload } = useSuppliers(categoryIds);

  // Coming back from the add-supplier screen: refetch so a supplier just saved with a
  // matching category shows up. The first focus is the mount, which fetches anyway.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) reload();
      focusedOnce.current = true;
    }, [reload]),
  );

  const data = useMemo<{ label: string; value: number | null }[]>(() => {
    const filtered =
      categoryIds.length > 0
        ? suppliers.filter(
            (s) =>
              s.is_active !== false &&
              s.category_ids?.some((cid) => categoryIds.includes(cid)),
          )
        : [];

    const items = filtered.map((s) => ({ label: s.name, value: s.id }));
    return allowNone
      ? [{ label: t('transactions.noSupplier'), value: null }, ...items]
      : items;
  }, [allowNone, categoryIds, suppliers, t]);

  return (
    <View>
      <DropdownField
        required={required}
        data={data}
        value={value}
        onChange={onChange}
        label={label ?? t('transactions.supplier', { defaultValue: 'Supplier' })}
        disabled={categoryIds.length === 0}
        inputStyle={inputStyle}
      />
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
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingTop: 6,
  },
});
