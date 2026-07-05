import React, { useMemo, useState } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { Button, Text, useTheme } from 'react-native-paper';
import {
  useLanguageContext,
  useRtlLabelStyle,
} from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import {
  FieldReviewNotice,
  useDismissFieldReview,
  useFieldReview,
} from './FieldReviewContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WheelDateMode = 'full' | 'monthYear' | 'dayOfMonth';

type FormWheelDateFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  mode?: WheelDateMode;
  minYear?: number;
  maxYear?: number;
};

type WheelItem = { value: number; label: string };

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function parseFull(value: string): { year: number; month: number; day: number } | null {
  if (!value || value.length < 10) return null;
  const [y, m, d] = value.split('-').map(Number);
  if ([y, m, d].some((n) => Number.isNaN(n))) return null;
  return { year: y, month: m, day: d };
}

function parseMonthYear(value: string): { year: number; month: number } | null {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) return null;
  return { year: parts[0], month: parts[1] };
}

function parseDayOfMonth(value: string): number | null {
  if (!value) return null;
  if (value.length >= 10) {
    const d = Number(value.slice(8, 10));
    return Number.isNaN(d) ? null : d;
  }
  const d = Number(value);
  return Number.isNaN(d) ? null : d;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatFullDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function formatMonthFor(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}-01`;
}

function formatSyntheticPaymentDate(day: number): string {
  return `2000-01-${String(day).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function displayFull(value: string, locale: string): string {
  const p = parseFull(value);
  if (!p) return '';
  const d = new Date(p.year, p.month - 1, p.day);
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

function displayMonthYear(value: string, locale: string): string {
  const p = parseMonthYear(value);
  if (!p) return '';
  const d = new Date(p.year, p.month - 1, 1);
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}

function displayDay(value: string): string {
  const d = parseDayOfMonth(value);
  if (d == null) return '';
  return String(d);
}

// ---------------------------------------------------------------------------
// Wheel data builders
// ---------------------------------------------------------------------------

function buildYearData(min: number, max: number): WheelItem[] {
  const items: WheelItem[] = [];
  for (let y = min; y <= max; y++) {
    items.push({ value: y, label: String(y) });
  }
  return items;
}

function buildMonthData(locale: string): WheelItem[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(2000, i, 1);
    return {
      value: i + 1,
      label: d.toLocaleDateString(locale, { month: 'long' }),
    };
  });
}

function buildDayData(): WheelItem[] {
  return Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
  }));
}

// ---------------------------------------------------------------------------
// Locale to BCP-47 helper
// ---------------------------------------------------------------------------

function toBcp47(lang: string): string {
  if (lang === 'he') return 'he-IL';
  return 'en-US';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormWheelDateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  mode = 'full',
  minYear,
  maxYear,
}: FormWheelDateFieldProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();
  const { language, isRtl } = useLanguageContext();
  const locale = toBcp47(language);
  const review = useFieldReview(name);
  const dismissReview = useDismissFieldReview();

  const now = new Date();
  const effectiveMinYear = minYear ?? now.getFullYear() - 5;
  const effectiveMaxYear = maxYear ?? now.getFullYear() + 10;

  const yearData = useMemo(
    () => buildYearData(effectiveMinYear, effectiveMaxYear),
    [effectiveMinYear, effectiveMaxYear],
  );
  const monthData = useMemo(() => buildMonthData(locale), [locale]);
  const dayData = useMemo(() => buildDayData(), []);

  const defaultPlaceholder =
    placeholder ??
    (mode === 'full'
      ? 'YYYY-MM-DD'
      : mode === 'monthYear'
        ? 'Month, Year'
        : '1-31');

  const [showPicker, setShowPicker] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const valueStr = (value as string) ?? '';
        const flagged = !!review && !error;

        const displayText =
          mode === 'full'
            ? displayFull(valueStr, locale)
            : mode === 'monthYear'
              ? displayMonthYear(valueStr, locale)
              : displayDay(valueStr);

        return (
          <View style={styles.inputWrap}>
            <View style={styles.labelRow}>
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
            </View>
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
                {displayText || defaultPlaceholder}
              </Text>
            </Pressable>

            {showPicker && (
              <WheelDateModal
                mode={mode}
                currentValue={valueStr}
                yearData={yearData}
                monthData={monthData}
                dayData={dayData}
                isRtl={isRtl}
                surfaceColor={theme.colors.surface}
                onConfirm={(formatted) => {
                  onChange(formatted);
                  if (review) dismissReview?.(name);
                  setShowPicker(false);
                }}
                onDismiss={() => setShowPicker(false)}
              />
            )}

            {error ? (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: colors.error }]}
              >
                {error.message}
              </Text>
            ) : null}
            {flagged ? <FieldReviewNotice source={review!.source} /> : null}
          </View>
        );
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Modal subcomponent
// ---------------------------------------------------------------------------

type WheelDateModalProps = {
  mode: WheelDateMode;
  currentValue: string;
  yearData: WheelItem[];
  monthData: WheelItem[];
  dayData: WheelItem[];
  isRtl: boolean;
  surfaceColor: string;
  onConfirm: (formatted: string) => void;
  onDismiss: () => void;
};

function WheelDateModal({
  mode,
  currentValue,
  yearData,
  monthData,
  dayData,
  isRtl,
  surfaceColor,
  onConfirm,
  onDismiss,
}: WheelDateModalProps) {
  const theme = useTheme();
  const itemColor = theme.dark ? darkColors.textPrimary : lightColors.textPrimary;
  const now = new Date();

  const initialState = useMemo(() => {
    if (mode === 'full') {
      const p = parseFull(currentValue);
      return {
        year: p?.year ?? now.getFullYear(),
        month: p?.month ?? now.getMonth() + 1,
        day: p?.day ?? now.getDate(),
      };
    }
    if (mode === 'monthYear') {
      const p = parseMonthYear(currentValue);
      return {
        year: p?.year ?? now.getFullYear(),
        month: p?.month ?? now.getMonth() + 1,
        day: 1,
      };
    }
    const d = parseDayOfMonth(currentValue);
    return { year: 2000, month: 1, day: d ?? 1 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [year, setYear] = useState(initialState.year);
  const [month, setMonth] = useState(initialState.month);
  const [day, setDay] = useState(initialState.day);

  const handleConfirm = () => {
    if (mode === 'full') {
      onConfirm(formatFullDate(year, month, day));
    } else if (mode === 'monthYear') {
      onConfirm(formatMonthFor(year, month));
    } else {
      onConfirm(formatSyntheticPaymentDate(day));
    }
  };

  const showYear = mode === 'full' || mode === 'monthYear';
  const showMonth = mode === 'full' || mode === 'monthYear';
  const showDay = mode === 'full' || mode === 'dayOfMonth';

  const wheels: React.ReactNode[] = [];

  if (showDay) {
    wheels.push(
      <WheelPicker
        key="day"
        data={dayData}
        value={day}
        onValueChanged={({ item: { value } }) => setDay(value)}
        width={mode === 'dayOfMonth' ? 120 : 70}
        itemHeight={44}
        visibleItemCount={5}
        itemTextStyle={{ color: itemColor }}
      />,
    );
  }

  if (showMonth) {
    wheels.push(
      <WheelPicker
        key="month"
        data={monthData}
        value={month}
        onValueChanged={({ item: { value } }) => setMonth(value)}
        width={130}
        itemHeight={44}
        visibleItemCount={5}
        itemTextStyle={{ color: itemColor }}
      />,
    );
  }

  if (showYear) {
    wheels.push(
      <WheelPicker
        key="year"
        data={yearData}
        value={year}
        onValueChanged={({ item: { value } }) => setYear(value)}
        width={90}
        itemHeight={44}
        visibleItemCount={5}
        itemTextStyle={{ color: itemColor }}
      />,
    );
  }

  if (isRtl) {
    wheels.reverse();
  }

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalDismissArea} onPress={onDismiss} />
        <View
          style={[styles.modalContent, { backgroundColor: surfaceColor }]}
        >
          <View style={styles.wheelsRow}>
            {wheels}
          </View>
          <Button onPress={handleConfirm} mode="contained">
            OK
          </Button>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontWeight: '500',
    flexShrink: 1,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  wheelsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
