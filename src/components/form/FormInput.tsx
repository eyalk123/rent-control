import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
} from "@/src/context";
import { darkColors, lightColors, spacing } from "@/src/theme";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
// 1. Import TextInput from react-native instead of react-native-paper
import { StyleSheet, View, TextInput as RNTextInput } from "react-native";
import { Text, useTheme } from "react-native-paper";

type FormInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof RNTextInput>["keyboardType"];
  multiline?: boolean;
  dense?: boolean;
};

function FormInputInner<TFieldValues extends FieldValues>({
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
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error },
      }) => (
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
          
          {/* 2. Use the native TextInput and style it to look like an outlined input */}
          <RNTextInput
            value={value as string}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={keyboardType}
            multiline={multiline}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            textAlign={isRtl ? "right" : "left"}
            style={[
              styles.nativeInput,
              {
                backgroundColor: colors.inputFilledBackground,
                borderColor: error ? colors.error : colors.outline,
                color: colors.textPrimary,
                minHeight: dense ? 40 : 48,
              },
              rtlInputStyle,
            ]}
          />
          {error ? (
            <Text
              variant="bodySmall"
              style={[styles.errorText, { color: colors.error }]}
            >
              {error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

export const FormInput = React.memo(FormInputInner) as typeof FormInputInner;

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
    fontWeight: "500",
  },
  nativeInput: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  errorText: {
    marginTop: 4,
  },
});