import React, { useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Text, useTheme } from 'react-native-paper';
import { useRtlLabelStyle } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

type FormMonthYearPickerFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
};

/** Parse YYYY-MM-DD or YYYY-MM to Date (first of month). */
function parseMonthYear(value: string): Date | null {
  if (!value) return null;
  const parts = value.split('-');
  const y = parseInt(parts[0], 10);
  const m = parts.length >= 2 ? parseInt(parts[1], 10) - 1 : 0;
  if (Number.isNaN(y)) return null;
  const d = new Date(y, m, 1);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Store as YYYY-MM-01. */
function formatToYYYYMM01(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

/** Display as "March 2026". */
function formatMonthYearDisplay(value: string): string {
  const d = parseMonthYear(value);
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });
}

export function FormMonthYearPickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Month, Year',
}: FormMonthYearPickerFieldProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange },
        fieldState: { error },
      }) => {
        const valueStr = (value as string) ?? '';
        const date = parseMonthYear(valueStr) ?? new Date();
        const displayText = valueStr ? formatMonthYearDisplay(valueStr) : '';

        const handleChange = (_event: unknown, selectedDate?: Date) => {
          if (Platform.OS === 'android') {
            setShowPicker(false);
          }
          if (selectedDate) {
            onChange(formatToYYYYMM01(selectedDate));
          }
        };

        return (
          <View style={styles.inputWrap}>
            <Text
              variant="bodyMedium"
              style={[
                styles.label,
                rtlLabelStyle,
                { color: error ? colors.error : colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={[
                styles.touchable,
                {
                  backgroundColor: colors.inputFilledBackground,
                  borderColor: error ? colors.error : colors.outline,
                },
              ]}
            >
              <Text
                variant="bodyLarge"
                style={[
                  styles.valueText,
                  { color: displayText ? colors.textPrimary : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {displayText || placeholder}
              </Text>
            </Pressable>
            {showPicker && (
              Platform.OS === 'android' ? (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={handleChange}
                />
              ) : (
                <Modal visible transparent animationType="slide">
                  <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowPicker(false)}
                  >
                    <Pressable
                      style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}
                      onPress={() => {}}
                    >
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display="spinner"
                        onChange={handleChange}
                      />
                      <Button onPress={() => setShowPicker(false)} mode="contained">
                        OK
                      </Button>
                    </Pressable>
                  </Pressable>
                </Modal>
              )
            )}
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

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  touchable: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 16,
  },
  errorText: {
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    paddingBottom: 40,
  },
});
