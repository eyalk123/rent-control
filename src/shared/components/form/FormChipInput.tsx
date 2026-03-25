import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, TextInput, Text, useTheme } from 'react-native-paper';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { useRtlInputStyle, useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { spacing, lightColors, darkColors } from '@/src/core/theme';

type FormChipInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
};

function FormChipInputInner<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
}: FormChipInputProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();

  const parseChips = React.useCallback((value: unknown): string[] => {
    if (typeof value !== 'string') return [];
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }, []);

  const joinChips = React.useCallback((chips: string[]): string => {
    return chips.join(', ');
  }, []);

  const [inputValue, setInputValue] = React.useState('');

  const handleAddChipFromInput = (
    currentFieldValue: unknown,
    onChange: (val: unknown) => void,
  ) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const existing = parseChips(currentFieldValue);
    const next = [...existing, trimmed];
    onChange(joinChips(next));
    setInputValue('');
  };

  const handleRemoveChip = (
    chip: string,
    currentFieldValue: unknown,
    onChange: (val: unknown) => void,
  ) => {
    const existing = parseChips(currentFieldValue);
    const next = existing.filter((c) => c !== chip);
    onChange(joinChips(next));
  };

  const handleChangeText = (
    text: string,
    currentFieldValue: unknown,
    onChange: (val: unknown) => void,
  ) => {
    if (text.includes(',')) {
      const parts = text.split(',');
      const first = parts[0]?.trim() ?? '';
      const rest = parts.slice(1).join(',');
      if (first.length > 0) {
        const existing = parseChips(currentFieldValue);
        const next = [...existing, first];
        onChange(joinChips(next));
      }
      setInputValue(rest);
    } else {
      setInputValue(text);
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => {
        const chips = parseChips(value);

        return (
          <View style={styles.inputWrap}>
            <Text
              variant="bodyMedium"
              style={[styles.label, rtlLabelStyle]}
              numberOfLines={1}
            >
              {label}
            </Text>
            <TextInput
              value={inputValue}
              onChangeText={(text) => handleChangeText(text, value, onChange)}
              onBlur={onBlur}
              mode="outlined"
              dense
              error={!!error}
              placeholder={placeholder}
              style={[
                styles.input,
                { backgroundColor: colors.inputFilledBackground },
                rtlInputStyle,
              ]}
              contentStyle={rtlInputStyle}
              textAlign={isRtl ? 'right' : 'left'}
              returnKeyType="done"
              onSubmitEditing={() => handleAddChipFromInput(value, onChange)}
            />
            <View style={styles.chipsContainer}>
              {chips.map((chip) => (
                <Chip
                  key={chip}
                  mode="outlined"
                  compact
                  onClose={() => handleRemoveChip(chip, value, onChange)}
                  style={styles.chip}
                  textStyle={styles.chipText}
                >
                  {chip}
                </Chip>
              ))}
            </View>
            {error ? (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: colors.error }]}
              >
                {error.message}
              </Text>
            ) : null}
          </View>
        );
      }}
    />
  );
}

export const FormChipInput = React.memo(FormChipInputInner) as typeof FormChipInputInner;

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  chip: {
    marginEnd: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
  },
  input: {
    marginBottom: 4,
  },
  errorText: {
    marginTop: 2,
    marginBottom: spacing.xs,
  },
});
