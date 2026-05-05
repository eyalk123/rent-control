import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
} from "@/src/core/context";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  Pressable,
  StyleSheet,
  View,
  TextInput as RNTextInput,
} from "react-native";
import { Text, useTheme } from "react-native-paper";

type FormInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof RNTextInput>["keyboardType"];
  multiline?: boolean;
  dense?: boolean;
  required?: boolean;
};

function FormInputInner<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  multiline,
  dense = true,
  required,
}: FormInputProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();
  const { t } = useTranslation();
  const inputRef = React.useRef<RNTextInput>(null);
  const [isFocused, setIsFocused] = React.useState(false);

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
            style={[styles.label, rtlLabelStyle, { color: error ? colors.error : colors.textPrimary }]}
            numberOfLines={1}
          >
            {label}{required ? <Text style={styles.asterisk}> *</Text> : null}
          </Text>

          <View>
            <RNTextInput
              ref={inputRef}
              value={value as string}
              onChangeText={onChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                onBlur();
              }}
              keyboardType={keyboardType}
              multiline={multiline}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              textAlign={isRtl ? "right" : "left"}
              style={[
                styles.nativeInput,
                {
                  backgroundColor: isFocused
                    ? colors.inputBackground
                    : colors.inputFilledBackground,
                  borderColor: isFocused
                    ? colors.primary
                    : error
                    ? colors.error
                    : colors.outline,
                  borderWidth: isFocused ? 2 : 1,
                  color: colors.textPrimary,
                },
                isFocused && styles.focusShadow,
                rtlInputStyle,
              ]}
            />
            {!isFocused && (
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => inputRef.current?.focus()}
              />
            )}
          </View>

          {error ? (
            <Text
              variant="bodySmall"
              style={[styles.errorText, { color: colors.error }]}
            >
              {t(error.message!, { defaultValue: error.message })}
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
  asterisk: {
    color: "#B85450",
    fontWeight: "500",
  },
  nativeInput: {
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 48,
  },
  focusShadow: {
    shadowColor: "rgba(30,58,95,1)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  errorText: {
    marginTop: 4,
  },
});
