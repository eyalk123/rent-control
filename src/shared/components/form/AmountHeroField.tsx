import React from "react";
import { StyleSheet, TextInput as RNTextInput, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, MAX_TIGHT_FONT_SCALE, spacing } from "@/src/core/theme";
import { currencyIsPrefix, currencySymbol } from "@/src/shared/utils/money";
import { FormField } from "./FormField";
import { useDismissFieldReview, useFieldReview } from "./FieldReviewContext";

/**
 * The amount as the headline of a money form: large, centred, with the currency beside it.
 *
 * The amount is the one value every transaction has and the one people check twice, and as
 * the third of nine identical boxes it read like any other field. Keeps the same RHF field,
 * keyboard, required marker, error and scan-review notice as `FormNumericField`.
 */
export function AmountHeroField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  required,
  tone,
}: {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  required?: boolean;
  /**
   * Shown as a small colored chip in place of the label: "Money out" on an expense, "Money
   * in" on a revenue. The direction is what tells the two forms apart at a glance; the
   * field keeps `label` as its accessible name.
   */
  tone?: { text: string; bg: string; fg: string };
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [focused, setFocused] = React.useState(false);
  const review = useFieldReview(name);
  const dismissReview = useDismissFieldReview();
  const symbol = (
    <Text style={[styles.symbol, { color: colors.placeholder }]} maxFontSizeMultiplier={MAX_TIGHT_FONT_SCALE}>
      {currencySymbol()}
    </Text>
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur, ref }, fieldState: { error } }) => (
        <FormField error={error} reviewName={name}>
          <View style={styles.wrap}>
            {tone ? (
              <View style={[styles.tone, { backgroundColor: tone.bg }]}>
                <Text style={[styles.toneText, { color: tone.fg }]}>{tone.text}</Text>
              </View>
            ) : (
              <Text style={[styles.label, { color: error ? colors.error : colors.fieldLabel }]}>
                {label}
                {required ? (
                  <Text style={{ color: colors.error }} accessibilityLabel={t("common.required")}>
                    {" *"}
                  </Text>
                ) : null}
              </Text>
            )}
            {/* Digits and symbol read left to right in both languages, over one underline. */}
            <View
              style={[
                styles.row,
                {
                  borderBottomColor: error
                    ? colors.error
                    : focused
                      ? colors.inputBorderFocus
                      : colors.inputBorder,
                },
              ]}
            >
              {currencyIsPrefix() ? symbol : null}
              <RNTextInput
                ref={ref}
                value={(value as string) ?? ""}
                onChangeText={(text) => {
                  onChange(text);
                  if (review) dismissReview?.(name);
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  onBlur();
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.placeholder}
                accessibilityLabel={required ? `${label}, ${t("common.required")}` : label}
                maxFontSizeMultiplier={MAX_TIGHT_FONT_SCALE}
                autoComplete="off"
                autoCorrect={false}
                importantForAutofill="no"
                inputAccessoryViewButtonLabel={t("common.keyboardDone")}
                style={[styles.input, { color: colors.textPrimary }]}
              />
              {currencyIsPrefix() ? null : symbol}
            </View>
          </View>
        </FormField>
      )}
    />
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  tone: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  toneText: {
    fontSize: 12,
    fontWeight: "500",
  },
  row: {
    direction: "ltr",
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: spacing.xs,
    minWidth: 140,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 2,
  },
  symbol: {
    fontSize: 26,
    fontWeight: "500",
  },
  input: {
    minWidth: 40,
    fontSize: 40,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});
