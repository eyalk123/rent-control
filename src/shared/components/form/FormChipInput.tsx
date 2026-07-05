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
  /** Restrict entry to non-negative integers and de-duplicate (e.g. reminder offsets). */
  numeric?: boolean;
  /** Keep chips sorted ascending (numerically when `numeric`, else lexically). */
  sort?: boolean;
};

function FormChipInputInner<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  numeric,
  sort,
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

  const finalize = React.useCallback(
    (chips: string[]): string => {
      let next = chips;
      if (sort) {
        next = numeric
          ? [...next].sort((a, b) => Number(a) - Number(b))
          : [...next].sort();
      }
      return next.join(', ');
    },
    [numeric, sort],
  );

  const addChip = React.useCallback(
    (raw: string, existing: string[]): string[] | null => {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      if (numeric) {
        const n = parseInt(trimmed, 10);
        if (Number.isNaN(n) || n < 0 || existing.includes(String(n))) return null;
        return [...existing, String(n)];
      }
      return [...existing, trimmed];
    },
    [numeric],
  );

  const [inputValue, setInputValue] = React.useState('');

  const handleAddChipFromInput = (
    currentFieldValue: unknown,
    onChange: (val: unknown) => void,
  ) => {
    const next = addChip(inputValue, parseChips(currentFieldValue));
    if (next) onChange(finalize(next));
    setInputValue('');
  };

  const handleRemoveChip = (
    chip: string,
    currentFieldValue: unknown,
    onChange: (val: unknown) => void,
  ) => {
    const existing = parseChips(currentFieldValue);
    const next = existing.filter((c) => c !== chip);
    onChange(finalize(next));
  };

  const handleChangeText = (
    rawText: string,
    currentFieldValue: unknown,
    onChange: (val: unknown) => void,
  ) => {
    const text = numeric ? rawText.replace(/[^0-9,]/g, '') : rawText;
    if (text.includes(',')) {
      const parts = text.split(',');
      const first = parts[0]?.trim() ?? '';
      const rest = parts.slice(1).join(',');
      const next = addChip(first, parseChips(currentFieldValue));
      if (next) onChange(finalize(next));
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
              keyboardType={numeric ? 'numeric' : undefined}
              placeholder={placeholder}
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              textContentType="none"
              style={[
                styles.input,
                { backgroundColor: colors.inputFilledBackground },
                rtlInputStyle,
              ]}
              outlineStyle={styles.inputOutline}
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
  inputOutline: {
    borderRadius: 4,
  },
  errorText: {
    marginTop: 2,
    marginBottom: spacing.xs,
  },
});
