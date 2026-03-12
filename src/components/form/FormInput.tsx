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
import { StyleSheet, View } from "react-native";
import { Text, TextInput, useTheme } from "react-native-paper";

type FormInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
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
            style={[
              styles.input,
              { backgroundColor: colors.inputFilledBackground },
              rtlInputStyle,
            ]}
            contentStyle={rtlInputStyle}
            placeholder={placeholder}
            textAlign={isRtl ? "right" : "left"}
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
  },
  input: {
    marginBottom: 0,
  },
  errorText: {
    marginTop: 2,
    marginBottom: spacing.xs,
  },
});
