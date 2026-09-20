import React from "react";
import { StyleSheet, TextInput as RNTextInput, type TextStyle } from "react-native";
import { useTheme } from "react-native-paper";
import { darkColors, lightColors } from "@/src/core/theme";
import { useRtlInputStyle } from "@/src/core/context";
import { useFieldSurface } from "./fieldSurface";

type LeaseYearAmountFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
};

/**
 * The per-year editable rent amount input shared by the renter form (LeaseTermBuilder's
 * custom mode) and the lease-extension screen. A flex-filling numeric field; the renter
 * form drives it through an RHF Controller, the extension screen through useState.
 *
 * Drawn by `useFieldSurface` like every other input. It used to carry its own box —
 * radius 8, border 1, height 40 — which put three different field shapes in one lease row
 * once the custom-mode rule dropdown (radius 12, border 1.5, 48 tall) appeared under it.
 * See MOBILE-DESIGN.md §4 "shape lock" and §5's 44pt touch-target floor, which the old 40
 * missed.
 */
function LeaseYearAmountFieldInner({ value, onChangeText, onBlur, placeholder = "0" }: LeaseYearAmountFieldProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  // `TextStyle extends ViewStyle`; the cast is only needed because ViewStyle types
  // `userSelect` as a loose string. Same array shape as FormInput.
  const surface = useFieldSurface() as TextStyle;

  return (
    <RNTextInput
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      keyboardType="decimal-pad"
      placeholder={placeholder}
      placeholderTextColor={colors.placeholder}
      style={[
        surface,
        styles.input,
        { color: colors.textPrimary },
        rtlInputStyle,
      ]}
    />
  );
}

export const LeaseYearAmountField = React.memo(LeaseYearAmountFieldInner);

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 16,
  },
});
