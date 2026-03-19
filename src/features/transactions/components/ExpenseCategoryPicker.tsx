import React, { useState } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Menu, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRtlInputStyle } from '@/src/context';
import { useExpenseCategories } from '@/src/features/transactions/hooks/useTransactions';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';

interface ExpenseCategoryPickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
}

export function ExpenseCategoryPicker({
  value,
  onChange,
  label,
  inputStyle,
}: ExpenseCategoryPickerProps) {
  const { t } = useTranslation();
  const rtlInputStyle = useRtlInputStyle();
  const { categories } = useExpenseCategories();
  const [visible, setVisible] = useState(false);

  const selected = categories.find((c) => c.id === value) ?? null;
  const displayValue = selected ? getCategoryDisplayName(selected, t) : '';

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const selectOption = (id: number | null) => {
    onChange(id);
    closeMenu();
  };

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <TextInput
          label={label ?? t('transactions.category', { defaultValue: 'Category' })}
          value={displayValue}
          mode="outlined"
          editable={false}
          dense
          right={<TextInput.Icon icon="menu-down" onPress={openMenu} />}
          onPressIn={openMenu}
          style={[styles.input, inputStyle as any, rtlInputStyle]}
          contentStyle={rtlInputStyle}
        />
      }
    >
      {categories.map((category) => (
        <Menu.Item
          key={category.id}
          onPress={() => selectOption(category.id)}
          title={getCategoryDisplayName(category, t)}
        />
      ))}
    </Menu>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 8,
  },
});
