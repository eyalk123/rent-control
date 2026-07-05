import React from "react";
import { StyleSheet, View, TextInput as RNTextInput } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useRtlInputStyle } from "@/src/core/context";

type EscalationValueFieldProps = {
  /** "fixed" shows a leading ₪ affix; "percent" shows a trailing % affix. */
  mode: "percent" | "fixed";
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  /** Overrides the default "yearly increase" caption. */
  label?: string;
};

/**
 * The "yearly increase" input shared by the renter form (LeaseTermBuilder) and the lease
 * extension screen. A caption plus a numeric field with a ₪ (fixed) or % (percent) affix.
 *
 * Layout stays direction-agnostic: the app forces native RTL (I18nManager.forceRTL), so a
 * plain `flexDirection: "row"` already lays out right-to-left in Hebrew — never reverse here.
 */
function EscalationValueFieldInner({ mode, value, onChangeText, onBlur, label }: EscalationValueFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();

  return (
    <View style={styles.row}>
      <Text style={[styles.caption, { color: colors.textSecondary }]}>
        {label ?? t("renter.yearlyIncrease")}
      </Text>
      <View
        style={[styles.affixInput, { borderColor: colors.outline, backgroundColor: colors.inputFilledBackground }]}
      >
        {mode === "fixed" ? <Text style={[styles.affix, { color: colors.textSecondary }]}>₪</Text> : null}
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          style={[styles.affixField, { color: colors.textPrimary }, rtlInputStyle]}
        />
        {mode === "percent" ? <Text style={[styles.affix, { color: colors.textSecondary }]}>%</Text> : null}
      </View>
    </View>
  );
}

export const EscalationValueField = React.memo(EscalationValueFieldInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  caption: {
    fontSize: 13,
  },
  affixInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    width: 130,
    gap: 6,
  },
  affixField: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  affix: {
    fontSize: 16,
    fontWeight: "600",
  },
});
