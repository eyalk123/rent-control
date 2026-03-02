import React, { useState } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Menu, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { usePropertyContext, useRtlInputStyle } from '@/src/context';

interface PropertyPickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
}

export function PropertyPicker({
  value,
  onChange,
  label,
  inputStyle,
}: PropertyPickerProps) {
  const { t } = useTranslation();
  const { properties } = usePropertyContext();
  const rtlInputStyle = useRtlInputStyle();
  const [visible, setVisible] = useState(false);

  const selectedProperty = properties.find((p) => p.id === value);
  const displayValue = selectedProperty
    ? selectedProperty.address
    : t('renter.unassigned');

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
          label={label ?? t('renter.property')}
          value={displayValue}
          mode="outlined"
          editable={false}
          dense
          right={<TextInput.Icon icon="menu-down" onPress={openMenu} />}
          onPressIn={openMenu}
          style={[styles.input, inputStyle as any]}
          contentStyle={rtlInputStyle}
        />
      }
    >
      <Menu.Item
        onPress={() => selectOption(null)}
        title={t('renter.unassigned')}
      />
      {properties.map((property) => (
        <Menu.Item
          key={property.id}
          onPress={() => selectOption(property.id)}
          title={`${property.address} - ${property.city}`}
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
