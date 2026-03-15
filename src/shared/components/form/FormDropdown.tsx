import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, TextInput, Text, useTheme } from 'react-native-paper';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { useRtlInputStyle, useLanguageContext, useRtlPlaceholder, useRtlLabelStyle } from '@/src/core/context';
import { spacing, lightColors, darkColors } from '@/src/core/theme';
import type { PropertyType } from '@/src/shared/types';
import { PROPERTY_TYPES } from '@/src/features/properties/validation/propertyValidation';

type FormDropdownProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  translateTypeLabel: (type: PropertyType) => string;
  placeholderKey: string;
};

export function FormDropdown<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  translateTypeLabel,
  placeholderKey,
}: FormDropdownProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();
  const [menuVisible, setMenuVisible] = React.useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View style={styles.inputWrap}>
          <Text
            variant="bodyMedium"
            style={[styles.label, rtlLabelStyle]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TextInput
                value={
                  value
                    ? translateTypeLabel(value as PropertyType)
                    : ''
                }
                mode="outlined"
                placeholder={rtlPlaceholder(placeholderKey)}
                dense
                editable={false}
                error={!!error}
                right={<TextInput.Icon icon="menu-down" onPress={() => setMenuVisible(true)} />}
                onPressIn={() => setMenuVisible(true)}
                style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
                contentStyle={rtlInputStyle}
                textAlign={isRtl ? 'right' : 'left'}
              />
            }
          >
            {PROPERTY_TYPES.map((ty) => (
              <Menu.Item
                key={ty}
                onPress={() => {
                  onChange(ty);
                  setMenuVisible(false);
                }}
                title={translateTypeLabel(ty)}
              />
            ))}
          </Menu>
          {error ? (
            <Text variant="bodySmall" style={[styles.errorText, { color: colors.error }]}>
              {error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
  },
  input: {
    marginBottom: 0,
  },
  errorText: {
    marginTop: 2,
    marginBottom: spacing.xs,
  },
});
