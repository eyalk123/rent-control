import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useRtlLabelStyle } from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { FieldReviewNotice, useFieldReview } from "./FieldReviewContext";

export interface FormFieldProps {
  label?: string;
  /** Marks the field with an asterisk. The app marks what is required, never what is optional. */
  required?: boolean;
  error?: { message?: string } | null;
  /** RHF field name, set only where this field participates in document-scan review. */
  reviewName?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Label, required marker, error text and scan-review notice for one form control.
 *
 * Every control used to carry its own copy of this: eleven components each declared an
 * `errorText` style, three declared a `labelRow`, and they had drifted apart — the property
 * form marked required fields with an asterisk while the transaction forms marked optional
 * ones in the label string, so neither told you what the other was saying. The wrapper is the
 * only thing that stops that happening again.
 */
export function FormField({
  label,
  required,
  error,
  reviewName,
  children,
  style,
}: FormFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();
  const review = useFieldReview(reviewName);
  // Don't double-decorate: an error already says the field needs attention.
  const flagged = !!review && !error;

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <Text
          variant="bodyMedium"
          style={[
            styles.label,
            rtlLabelStyle,
            { color: error ? colors.error : colors.fieldLabel },
          ]}
          numberOfLines={1}
        >
          {label}
          {required ? (
            <Text style={{ color: colors.error }} accessibilityLabel={t("common.required")}>
              {" *"}
            </Text>
          ) : null}
        </Text>
      ) : null}

      {children}

      {error?.message ? (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {/* Zod messages are i18n keys ("validation.required"); fall back to the raw string
              so a message that is not a key still renders. */}
          {t(error.message, { defaultValue: error.message })}
        </Text>
      ) : null}
      {flagged ? <FieldReviewNotice source={review!.source} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    // A step below textPrimary, so the value stays the darkest thing in the field, but only
    // a step: see `fieldLabel` in colors.ts for what the gap costs at this size.
    fontWeight: "500",
    fontSize: 14,
    marginBottom: 5,
    flexShrink: 1,
  },
  errorText: {
    marginTop: 4,
    // bodySmall is 12px; an error is the one line on a field you must not miss.
    fontSize: 13,
    fontWeight: "500",
  },
});
