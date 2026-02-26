import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Menu, TextInput } from 'react-native-paper';
import { usePropertyContext } from '@/src/context';

interface PropertyPickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
}

export function PropertyPicker({
  value,
  onChange,
  label = 'Property',
}: PropertyPickerProps) {
  const { properties } = usePropertyContext();
  const [visible, setVisible] = useState(false);

  const selectedProperty = properties.find((p) => p.id === value);
  const displayValue = selectedProperty
    ? selectedProperty.address
    : 'Unassigned';

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
          label={label}
          value={displayValue}
          mode="outlined"
          editable={false}
          right={<TextInput.Icon icon="menu-down" onPress={openMenu} />}
          onPressIn={openMenu}
          style={styles.input}
        />
      }
    >
      <Menu.Item
        onPress={() => selectOption(null)}
        title="Unassigned"
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
    marginBottom: 12,
  },
});
