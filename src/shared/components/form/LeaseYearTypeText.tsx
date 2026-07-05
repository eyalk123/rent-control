import React from "react";
import { StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors } from "@/src/core/theme";
import type { LeaseYearType } from "@/src/shared/types";

type LeaseYearTypeTextProps = {
  type: LeaseYearType;
  /** Extra style merged after color/weight, e.g. per-screen textAlign. */
  style?: StyleProp<TextStyle>;
};

/**
 * The "contract" / "option" year label shared by the renter form and the lease extension
 * screen — option is accented and bold, contract is muted. Callers own any wrapping (e.g. a
 * tappable toggle) and pass layout tweaks via `style`.
 */
function LeaseYearTypeTextInner({ type, style }: LeaseYearTypeTextProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const isOption = type === "option";

  return (
    <Text
      style={[
        styles.text,
        { color: isOption ? colors.accent : colors.textSecondary, fontWeight: isOption ? "700" : "600" },
        style,
      ]}
    >
      {isOption ? t("renter.leaseYearTypeOption") : t("renter.leaseYearTypeContract")}
    </Text>
  );
}

export const LeaseYearTypeText = React.memo(LeaseYearTypeTextInner);

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
  },
});
