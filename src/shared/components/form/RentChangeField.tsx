import React from "react";
import { allowedModes } from "@/src/shared/utils/capabilities";
import { RENT_ESCALATION_MODES, RENT_MODE_REQUIREMENTS } from "@/src/shared/constants/rentModes";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { SegmentedControl, type Segment } from "@/src/shared/components/ui";
import type { RentEscalationMode } from "@/src/shared/types";
import { EscalationValueField } from "./EscalationValueField";
import { ANCHORS } from "@/src/features/onboarding/anchors";
import { TourAnchor, useTourAnchor } from "@/src/features/onboarding/AnchorRegistry";

// Re-exported so the existing import path (and the form barrel) keeps working.
export { RENT_ESCALATION_MODES, RENT_MODE_REQUIREMENTS };

/** The modes an open-ended lease can use — see the `openEnded` prop. */
const CHAINABLE_OPEN_ENDED_MODES = new Set<RentEscalationMode>(["none", "percent", "fixed"]);

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
  /**
   * Narrows the list to the modes an endless lease can be priced by.
   *
   * `custom` gives every year its own rule and `cpi` needs an index reading per year —
   * neither can be written for a year the generator has not appended yet, which is why the
   * API refuses both alongside the switch. Offering them would only produce a rejected save.
   */
  openEnded?: boolean;
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
  openEnded = false,
}: RentChangeFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  // The lease-form tour seeds CPI and Custom from this control — neither mode is
  // guessable from its label alone.
  const anchorRef = useTourAnchor(ANCHORS.leaseRentChangeField);

  const segments: Segment<RentEscalationMode>[] = allowedModes(
    RENT_ESCALATION_MODES,
    RENT_MODE_REQUIREMENTS,
  )
    .filter((m) => !openEnded || CHAINABLE_OPEN_ENDED_MODES.has(m))
    .map((m) => ({
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
    <View ref={anchorRef} collapsable={false}>
      <SegmentedControl
        label={label}
        segments={segments}
        fitContent={fitContent}
        value={mode}
        onChange={onModeChange}
      />

      {mode === "cpi" ? (
        // The CPI elaboration opens here. Picking CPI replaces the value field with this
        // note, so the note is the only thing on screen for the tour to point at.
        <TourAnchor id={ANCHORS.leaseCpiBase}>
          <Text style={[styles.cpiNote, { color: colors.textSecondary }]}>
            {t("renter.rentChangeCpiNote")}
          </Text>
        </TourAnchor>
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
