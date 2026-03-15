import React, { useState } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Menu, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRenterContext, useRtlInputStyle } from '@/src/context';

interface RenterPickerProps {
  propertyId: number | null;
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
  allowNone?: boolean;
}

export function RenterPicker({
  propertyId,
  value,
  onChange,
  label,
  inputStyle,
  allowNone = true,
}: RenterPickerProps) {
  const { t } = useTranslation();
  const { renters } = useRenterContext();
  const rtlInputStyle = useRtlInputStyle();
  const [visible, setVisible] = useState(false);

  const filteredRenters = renters.filter(
    (r) => propertyId == null || r.property_id === propertyId,
  );

  const selectedRenter = filteredRenters.find((r) => r.id === value) ?? null;
  const displayValue = selectedRenter
    ? `${selectedRenter.first_name} ${selectedRenter.last_name}`
    : allowNone
      ? t('renter.unassigned')
      : '';

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
          style={[styles.input, inputStyle as any, rtlInputStyle]}
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
      {filteredRenters.map((renter) => (
        <Menu.Item
          key={renter.id}
          onPress={() => selectOption(renter.id)}
          title={`${renter.first_name} ${renter.last_name}`}
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
