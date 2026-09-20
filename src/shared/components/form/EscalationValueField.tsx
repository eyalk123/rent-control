import React from "react";
import { currencySymbol } from '@/src/shared/utils/money';
import { StyleSheet, View, TextInput as RNTextInput, type StyleProp, type ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useRtlInputStyle } from "@/src/core/context";
import { useFieldSurface } from "./fieldSurface";

type EscalationValueFieldProps = {
  /** "fixed" shows a leading ₪ affix; "percent" shows a trailing % affix. */
  mode: "percent" | "fixed";
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  /** Overrides the default "yearly increase" caption. */
  label?: string;
  /** Row override for callers that lay this out inline — see LeaseYearRow's rule row. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Box override, for sizing the field inside a row that owns the widths. */
  boxStyle?: StyleProp<ViewStyle>;
};

/**
 * The "yearly increase" input shared by the renter form (LeaseTermBuilder) and the lease
 * extension screen. A caption plus a numeric field with a ₪ (fixed) or % (percent) affix.
 *
 * Layout stays direction-agnostic: the app forces native RTL (I18nManager.forceRTL), so a
 * plain `flexDirection: "row"` already lays out right-to-left in Hebrew — never reverse here.
 *
 * The box comes from `useFieldSurface`, so it matches every other input — including the
 * lease-row amount field it sits under in custom mode. It used to draw radius 8 / border 1
 * by hand, against the dropdown beside it at radius 12 / border 1.5.
 */
function EscalationValueFieldInner({ mode, value, onChangeText, onBlur, label, containerStyle, boxStyle }: EscalationValueFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const surface = useFieldSurface();

  const caption = label ?? t("renter.yearlyIncrease");

  return (
    <View style={[styles.row, containerStyle]}>
      {caption ? (
        <Text style={[styles.caption, { color: colors.textSecondary }]}>{caption}</Text>
      ) : null}
      <View style={[surface, styles.affixInput, boxStyle]}>
        {mode === "fixed" ? (
          <Text style={[styles.affix, { color: colors.textSecondary }]}>{currencySymbol()}</Text>
        ) : null}
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
    // `useFieldSurface` centres on the main axis, which is horizontal once this box becomes
    // a row; the affix and the field belong at the start with the text centred vertically.
    justifyContent: "flex-start",
    alignItems: "center",
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
