import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useRtlLabelStyle } from "@/src/core/context";
import { Stepper } from "@/src/shared/components/ui";

type LeaseTermRowProps = {
  /** What the pair counts, e.g. "Contract term" or "Option years to add". */
  label: string;
  years: number;
  onYearsChange: (value: number) => void;
  maxYears: number;
  months: number;
  onMonthsChange: (value: number) => void;
};

/**
 * One period of a lease — years plus extra months — as a single labelled line. The renter
 * form and the extension screen each render two: the contract term and the option term.
 *
 * It used to be four full-width steppers stacked, each with its own label ("Contract term",
 * "Extra months", "Renewal options", "Extra option months"). The months are a remainder of
 * the same period, so they sit beside the years and the unit inside each stepper says which
 * is which. Compact steppers keep both on one line at 360dp.
 */
function LeaseTermRowInner({
  label,
  years,
  onYearsChange,
  maxYears,
  months,
  onMonthsChange,
}: LeaseTermRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <View style={styles.container}>
      <Text variant="bodyMedium" style={[styles.label, rtlLabelStyle, { color: colors.fieldLabel }]}>
        {label}
      </Text>
      {/* Plain "row", never reversed: the app forces native RTL, so this already puts the
          years first on the right in Hebrew and on the left in English. The extension screen
          passed `row-reverse` here and flipped Hebrew back to years-on-the-left. */}
      <View style={styles.steppers}>
        <Stepper
          compact
          unitLabel={t("renter.yearsUnit")}
          min={0}
          max={maxYears}
          value={years}
          onChange={onYearsChange}
        />
        <Stepper
          compact
          unitLabel={t("renter.monthsUnit")}
          min={0}
          max={11}
          value={months}
          onChange={onMonthsChange}
        />
      </View>
    </View>
  );
}

export const LeaseTermRow = React.memo(LeaseTermRowInner);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  // Matches Stepper's own label, which this replaces.
  label: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  steppers: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
