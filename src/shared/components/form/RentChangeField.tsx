import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { SegmentedControl, type Segment } from "@/src/shared/components/ui";
import type { RentEscalationMode } from "@/src/shared/types";
import { EscalationValueField } from "./EscalationValueField";

/**
 * The escalation modes, in display order. Every caller offers all of them. `custom` leads
 * because it is the one that expresses a real lease — the other four are each a special case
 * of it. It is not the default; every caller sets `none` explicitly.
 */
export const RENT_ESCALATION_MODES: RentEscalationMode[] = [
  "custom",
  "none",
  "percent",
  "fixed",
  "cpi",
];

type RentChangeFieldProps = {
  /** Caption above the control — the two callers word it differently (whole lease vs. new years). */
  label: string;
  mode: RentEscalationMode;
  onModeChange: (mode: RentEscalationMode) => void;
  /** Percent / ₪ step. Ignored (and hidden) in the none/cpi/custom modes. */
  value: string;
  onValueChange: (value: string) => void;
  onValueBlur?: () => void;
  /** Size segments to their labels — see SegmentedControl. */
  fitContent?: boolean;
};

/**
 * The "how does the rent change" control: mode toggle + the CPI explainer + the percent/₪
 * step field. Shared by the renter form (LeaseTermBuilder, driven by RHF Controllers) and
 * the lease-extension screen (driven by useState) so the two can't drift apart on which
 * modes exist or how each one is presented.
 */
function RentChangeFieldInner({
  label,
  mode,
  onModeChange,
  value,
  onValueChange,
  onValueBlur,
  fitContent = false,
}: RentChangeFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const segments: Segment<RentEscalationMode>[] = RENT_ESCALATION_MODES.map((m) => ({
    value: m,
    label: t(
      {
        none: "renter.rentChangeSame",
        percent: "renter.rentChangePercent",
        fixed: "renter.rentChangeFixed",
        cpi: "renter.rentChangeCpi",
        custom: "renter.rentChangeCustom",
      }[m],
    ),
  }));

  return (
    <View>
      <SegmentedControl
        label={label}
        segments={segments}
        fitContent={fitContent}
        value={mode}
        onChange={onModeChange}
      />

      {mode === "cpi" ? (
        <Text style={[styles.cpiNote, { color: colors.textSecondary }]}>
          {t("renter.rentChangeCpiNote")}
        </Text>
      ) : null}

      {mode === "percent" || mode === "fixed" ? (
        <EscalationValueField
          mode={mode}
          value={value}
          onChangeText={onValueChange}
          onBlur={onValueBlur}
        />
      ) : null}
    </View>
  );
}

export const RentChangeField = React.memo(RentChangeFieldInner);

const styles = StyleSheet.create({
  cpiNote: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
});
