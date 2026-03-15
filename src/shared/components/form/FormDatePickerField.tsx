import React, { useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Text, useTheme } from 'react-native-paper';
import {
  useLanguageContext,
  useRtlLabelStyle,
} from '@/src/core/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

type FormDatePickerFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
};

function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYYYYMMDD(value: string): Date | null {
  if (!value || value.length < 10) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value: string): string {
  const d = parseYYYYMMDD(value);
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function FormDatePickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'YYYY-MM-DD',
}: FormDatePickerFieldProps<TFieldValues>) {
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
        const date = parseYYYYMMDD(valueStr) ?? new Date();
        const displayText = valueStr ? formatDisplayDate(valueStr) : '';

        const handleChange = (_event: unknown, selectedDate?: Date) => {
          if (Platform.OS === 'android') {
            setShowPicker(false);
          }
          if (selectedDate) {
            onChange(formatDateToYYYYMMDD(selectedDate));
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
