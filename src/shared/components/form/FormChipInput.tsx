import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, StyleSheet, TextInput as RNTextInput } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { useRtlInputStyle, useLanguageContext } from '@/src/context';
import { spacing, lightColors, darkColors } from '@/src/core/theme';
import { FormField } from './FormField';
import { useFieldFocusShadow, useFieldSurface } from './fieldSurface';

type FormChipInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  /** Restrict entry to non-negative integers and de-duplicate (e.g. reminder offsets). */
  numeric?: boolean;
  /** Keep chips sorted ascending (numerically when `numeric`, else lexically). */
  sort?: boolean;
  required?: boolean;
};

function FormChipInputInner<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  numeric,
  sort,
  required,
}: FormChipInputProps<TFieldValues>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl } = useLanguageContext();

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
  const [isFocused, setIsFocused] = React.useState(false);

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
          <FormField label={label} required={required} error={error}>
            <ChipTextBox
              value={inputValue}
              onChangeText={(text) => handleChangeText(text, value, onChange)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                onBlur();
              }}
              focused={isFocused}
              hasError={!!error}
              keyboardType={numeric ? 'numeric' : undefined}
              inputAccessoryViewButtonLabel={t('common.keyboardDone')}
              placeholder={placeholder}
              placeholderTextColor={colors.placeholder}
              autoComplete="off"
              autoCorrect={false}
              importantForAutofill="no"
              textContentType="none"
              textColor={colors.textPrimary}
              rtlInputStyle={rtlInputStyle}
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
          </FormField>
        );
      }}
    />
  );
}

/** Split out so the surface hooks are not called inside a render prop. Same box as FormInput. */
function ChipTextBox({
  focused,
  hasError,
  textColor,
  rtlInputStyle,
  ...rest
}: {
  focused: boolean;
  hasError: boolean;
  textColor: string;
  rtlInputStyle: object;
} & React.ComponentProps<typeof RNTextInput>) {
  const surface = useFieldSurface({ focused, error: hasError });
  const focusShadow = useFieldFocusShadow();
  return (
    <RNTextInput
      {...rest}
      style={[
        surface,
        styles.input,
        { color: textColor },
        focused && focusShadow,
        rtlInputStyle,
      ]}
    />
  );
}

export const FormChipInput = React.memo(FormChipInputInner) as typeof FormChipInputInner;

const styles = StyleSheet.create({
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
  },
  chip: {
    marginEnd: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
  },
  input: {
    fontSize: 16,
    marginBottom: spacing.xs,
  },
});
