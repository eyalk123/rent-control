import React, { useState } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Menu, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRtlInputStyle } from '@/src/context';
import { useSuppliers } from '@/src/hooks/useTransactions';

interface SupplierPickerProps {
  categoryId: number | null;
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
  allowNone?: boolean;
}

export function SupplierPicker({
  categoryId,
  value,
  onChange,
  label,
  inputStyle,
  allowNone = true,
}: SupplierPickerProps) {
  const { t } = useTranslation();
  const rtlInputStyle = useRtlInputStyle();
  const { suppliers } = useSuppliers(categoryId ?? undefined);
  const [visible, setVisible] = useState(false);

  const selected = suppliers.find((s) => s.id === value) ?? null;
  const displayValue = selected ? selected.name : allowNone ? t('renter.unassigned') : '';

  const openMenu = () => {
    if (!categoryId) return;
    setVisible(true);
  };
  const closeMenu = () => setVisible(false);

  const selectOption = (id: number | null) => {
    onChange(id);
    closeMenu();
  };

  const disabled = !categoryId;

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <TextInput
          label={label ?? t('transactions.supplier', { defaultValue: 'Supplier' })}
          value={displayValue}
          mode="outlined"
          editable={false}
          dense
          right={<TextInput.Icon icon="menu-down" onPress={openMenu} />}
          onPressIn={openMenu}
          style={[styles.input, inputStyle as any, rtlInputStyle, disabled && styles.disabledInput]}
          contentStyle={rtlInputStyle}
        />
      }
    >
      {allowNone && (
        <Menu.Item
          onPress={() => selectOption(null)}
          title={t('renter.unassigned')}
        />
      )}
      {suppliers.map((supplier) => (
        <Menu.Item
          key={supplier.id}
          onPress={() => selectOption(supplier.id)}
          title={supplier.name}
        />
      ))}
    </Menu>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 8,
  },
  disabledInput: {
    opacity: 0.6,
  },
});

