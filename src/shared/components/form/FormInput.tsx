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
import {
  FieldReviewBadge,
  FieldReviewSource,
  FIELD_REVIEW_COLOR,
  useDismissFieldReview,
  useFieldReview,
} from "./FieldReviewContext";

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
  const review = useFieldReview(name);
  const dismissReview = useDismissFieldReview();

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur },
        fieldState: { error },
      }) => {
        // Don't double-decorate when the field is in an error state.
        const flagged = !!review && !error;
        const handleChange = (text: string) => {
          onChange(text);
          if (review) dismissReview?.(name);
        };
        return (
        <View style={styles.inputWrap}>
          <View style={styles.labelRow}>
            <Text
              variant="bodyMedium"
              style={[styles.label, rtlLabelStyle, { color: error ? colors.error : colors.textPrimary }]}
              numberOfLines={1}
            >
              {label}{required ? <Text style={styles.asterisk}> *</Text> : null}
            </Text>
            {flagged ? <FieldReviewBadge /> : null}
          </View>

          <View>
            <RNTextInput
              ref={inputRef}
              value={value as string}
              onChangeText={handleChange}
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
                    : flagged
                    ? FIELD_REVIEW_COLOR
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
          {flagged ? <FieldReviewSource source={review!.source} /> : null}
        </View>
        );
      }}
    />
  );
}

export const FormInput = React.memo(FormInputInner) as typeof FormInputInner;

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontWeight: "500",
    flexShrink: 1,
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
