import React from "react";
import { StyleSheet, TextInput as RNTextInput } from "react-native";
import { useTheme } from "react-native-paper";
import { darkColors, lightColors } from "@/src/core/theme";
import { useRtlInputStyle } from "@/src/core/context";

type LeaseYearAmountFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
};

/**
 * The per-year editable rent amount input shared by the renter form (LeaseTermBuilder's
 * custom mode) and the lease-extension screen. A flex-filling numeric field styled to match
 * the lease-year rows; the renter form drives it through an RHF Controller, the extension
 * screen through useState.
 */
function LeaseYearAmountFieldInner({ value, onChangeText, onBlur, placeholder = "0" }: LeaseYearAmountFieldProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();

  return (
    <RNTextInput
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      keyboardType="decimal-pad"
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      style={[
        styles.input,
        { borderColor: colors.outline, backgroundColor: colors.inputFilledBackground, color: colors.textPrimary },
        rtlInputStyle,
      ]}
    />
  );
}

export const LeaseYearAmountField = React.memo(LeaseYearAmountFieldInner);

const styles = StyleSheet.create({
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 0,
    height: 40,
    fontSize: 15,
  },
});
