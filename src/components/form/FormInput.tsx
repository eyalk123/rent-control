import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text, useTheme } from 'react-native-paper';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { useRtlInputStyle, useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { spacing, lightColors, darkColors } from '@/src/theme';

type FormInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  multiline?: boolean;
  dense?: boolean;
};

export function FormInput<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  multiline,
  dense = true,
}: FormInputProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View style={styles.inputWrap}>
          <Text
            variant="bodyMedium"
            style={[styles.label, rtlLabelStyle]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <TextInput
            // We render a separate label Text above, so keep the field itself label-less
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!error}
            mode="outlined"
            dense={dense}
            keyboardType={keyboardType}
            multiline={multiline}
            style={[styles.input, { backgroundColor: colors.inputFilledBackground }, rtlInputStyle]}
            contentStyle={rtlInputStyle}
            placeholder={placeholder}
            textAlign={isRtl ? 'right' : 'left'}
          />
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

