import React from "react";
import { allowedModes } from "@/src/shared/utils/capabilities";
import { indexLabelKey } from "@/src/shared/utils/indexLabels";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing, ICON_SM } from "@/src/core/theme";
import { CpiChip, Icon } from "@/src/shared/components/ui";
import { formatMoney } from "@/src/shared/utils/money";
import type { LeaseYearRuleMode, LeaseYearType } from "@/src/shared/types";
import { LeaseYearAmountField } from "./LeaseYearAmountField";
import { LeaseYearTypeText } from "./LeaseYearTypeText";
import { EscalationValueField } from "./EscalationValueField";
import { DropdownField } from "./DropdownField";

/**
 * The per-year rule options. Same set as the whole-lease RENT_ESCALATION_MODES (minus
 * `custom`, which has no meaning for a single year), plus `manual` — the neutral default,
 * meaning "this amount was typed, not derived", which is why it leads here rather than
 * following that array's order.
 */
export const LEASE_YEAR_RULE_MODES: LeaseYearRuleMode[] = [
  "manual",
  "none",
  "percent",
  "fixed",
  "cpi",
];

/**
 * Which of those a country may actually pick. The full list stays intact: an existing
 * lease can still *hold* a `cpi` rule and must keep rendering, and the label map still
 * needs its entry. Only the picker narrows.
 */
const RULE_MODE_REQUIREMENTS: Partial<Record<LeaseYearRuleMode, "cpiLinkage">> = {
  cpi: "cpiLinkage",
};

export const LEASE_YEAR_RULE_LABEL_KEYS: Record<LeaseYearRuleMode, string> = {
  manual: "renter.rentChangeManual",
  none: "renter.rentChangeSame",
  percent: "renter.rentChangePercent",
  fixed: "renter.rentChangeFixed",
  cpi: "renter.rentChangeCpi",
};

type LeaseYearRowProps = {
  /** Year caption, e.g. "2026" or "Year 2". */
  label: string;
  /** Kept as a string because both callers hold amounts as form strings while typing. */
  amount: string;
  type: LeaseYearType;
  /** Highlights the row the lease is currently in. */
  isCurrent?: boolean;
  /**
   * Editable amount when provided; a read-only formatted amount otherwise. Ignored on a
   * `cpi` year, whose amount is never editable — see `amountEditable`.
   */
  onAmountChange?: (value: string) => void;
  onAmountBlur?: () => void;
  /** Makes the contract/option label a tappable switch. */
  onTypeToggle?: () => void;
  onRemove?: () => void;
  /**
   * Amounts the client can only estimate (CPI years past the base) — rendered muted with a
   * "≈" and a CPI chip so they don't read as a firm figure.
   */
  projected?: boolean;
  /** Trailing chip, e.g. the extension screen's "New" tag. */
  badge?: React.ReactNode;
  /**
   * Row direction. The two screens currently disagree on how to derive this under forced
   * RTL, so each one passes its own rather than this component guessing.
   */
  rowDirection: ViewStyle["flexDirection"];
  /**
   * How this year's rent derives from the previous year's. The dropdown renders only when
   * `onRuleChange` is passed (custom mode, and never on year one, which *is* the base rent).
   */
  ruleMode?: LeaseYearRuleMode;
  onRuleChange?: (mode: LeaseYearRuleMode) => void;
  /** The percent / ₪ step. Its field appears only for the `percent` and `fixed` rules. */
  ruleValue?: string;
  onRuleValueChange?: (value: string) => void;
  onRuleValueBlur?: () => void;
  /** Per-row validation message, e.g. a percent rule with no value. */
  error?: string;
  /** A hairline above the row, separating it from the year before. */
  divider?: boolean;
};

/**
 * One lease-year row: year label, rent amount, contract/option type, and the optional
 * current-lease / projected / "New" chips. Shared by the renter form (LeaseTermBuilder) and
 * the lease-extension screen so a schedule looks and behaves the same wherever it is edited.
 * Which affordances appear is entirely driven by the handlers the caller passes.
 */
function LeaseYearRowInner({
  label,
  amount,
  type,
  isCurrent = false,
  onAmountChange,
  onAmountBlur,
  onTypeToggle,
  onRemove,
  projected = false,
  badge,
  rowDirection,
  divider = false,
  ruleMode = "manual",
  onRuleChange,
  ruleValue = "",
  onRuleValueChange,
  onRuleValueBlur,
  error,
}: LeaseYearRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const amountNum = Number(amount) || 0;
  // A CPI year's rent is index-linked and priced server-side, so the figure here is only an
  // estimate — and typing over it would silently drop the rule. Show it, don't let it be edited.
  //
  // Any other ruled year (custom mode) is worked out from the year before it, so it reads as
  // a figure too, not a box to fill in. Picking "Manual" in its rule is how it gets typed over.
  const showRuleValue = ruleMode === "percent" || ruleMode === "fixed";
  const ruled = Boolean(onRuleChange) && ruleMode !== "manual";
  const amountEditable = Boolean(onAmountChange) && ruleMode !== "cpi" && !ruled;

  const ruleOptions = allowedModes(LEASE_YEAR_RULE_MODES, RULE_MODE_REQUIREMENTS).map((m) => ({
    value: m,
    // `cpi` is the one mode whose name the country decides — see `indexLabels.ts`.
    label: t(m === "cpi" ? indexLabelKey() : LEASE_YEAR_RULE_LABEL_KEYS[m]),
  }));

  return (
    // No fill on the current year: the bold label and its "Now" chip already mark it, and the
    // mustard wash read as a highlight competing with the renter's own color. Years are
    // told apart by a hairline instead, as on the detail screen's lease card.
    <View style={divider ? [styles.divider, { borderTopColor: colors.outline }] : undefined}>
    {/* Three columns: the year (with its Now / New tag under it), the money, and the row's
        actions. The amount and the custom-mode rule stack in the middle column, so they are
        always the same width and start at the same edge — whatever tags and buttons a given
        row carries only ever narrow the column, never knock the two out of line. */}
    <View style={[styles.row, { flexDirection: rowDirection }]}>
      <View style={styles.yearCol}>
        <Text
          style={[styles.yearLabel, { color: colors.textPrimary }, isCurrent && styles.yearLabelCurrent]}
        >
          {label}
        </Text>
        {isCurrent ? (
          <View style={[styles.chip, styles.chipOutlined, { borderColor: colors.accent }]}>
            <Text style={[styles.chipText, { color: colors.textPrimary }]}>{t("renter.currentYear")}</Text>
          </View>
        ) : null}
        {badge}
      </View>

      <View style={styles.moneyCol}>
        {amountEditable && onAmountChange ? (
          <LeaseYearAmountField
            value={amount}
            onChangeText={onAmountChange}
            onBlur={onAmountBlur}
            placeholder={t("renter.leaseYearAmount")}
          />
        ) : (
          // Plain "row" and the field's own inset, so a worked-out amount sits exactly where
          // a typed one does in the input above or below it — whatever `rowDirection` says.
          <View style={styles.amountBlock}>
            <Text
              style={[
                styles.amountText,
                { color: projected ? colors.textSecondary : colors.textPrimary },
              ]}
            >
              {amountNum > 0 ? `${projected ? "≈ " : ""}${formatMoney(amountNum)}` : "–"}
            </Text>
            {projected ? <CpiChip flexDirection={rowDirection} /> : null}
          </View>
        )}

        {/* The rule, and for percent / fixed its step under it. Stacked, not side by side: the
            column is ~145dp on a phone, and the two together left the rule ~50dp, too narrow
            for its own label. Every box in the column is the same width and height. */}
        {onRuleChange ? (
          <>
            <DropdownField
              data={ruleOptions}
              sorted={false}
              value={ruleMode}
              onChange={(m) => onRuleChange(m as LeaseYearRuleMode)}
              placeholder={t("renter.yearRule")}
              error={error ? {} : undefined}
              inputStyle={styles.ruleDropdown}
            />
            {showRuleValue && onRuleValueChange ? (
              <EscalationValueField
                mode={ruleMode as "percent" | "fixed"}
                value={ruleValue}
                onChangeText={onRuleValueChange}
                onBlur={onRuleValueBlur}
                label=""
                containerStyle={styles.ruleValue}
                boxStyle={styles.ruleValueBox}
              />
            ) : null}
          </>
        ) : null}

        {error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {t(error, { defaultValue: error })}
          </Text>
        ) : null}
      </View>

      <View style={[styles.actionsCol, { flexDirection: rowDirection }]}>
        {/* An editable row shows the projection chip here — its amount lives in an input, so
            the read-only branch (which owns the other chip) never renders. */}
        {amountEditable && projected ? <CpiChip flexDirection={rowDirection} /> : null}

        {/* Outlined with a swap icon so it reads as a control. It used to be plain text with
            nothing to say it could be tapped. The read-only label below stays bare, so the
            difference between the two is visible at a glance. */}
        {onTypeToggle ? (
          <Pressable
            onPress={onTypeToggle}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={t("renter.tapToChangeType")}
            style={({ pressed }) => [
              styles.typeChip,
              {
                flexDirection: rowDirection,
                borderColor: type === "option" ? colors.accent : colors.inputBorder,
              },
              pressed && styles.pressed,
            ]}
          >
            <LeaseYearTypeText type={type} style={styles.typeText} />
            <Icon
              name="arrow-right-left"
              size={12}
              color={type === "option" ? colors.accent : colors.textSecondary}
            />
          </Pressable>
        ) : (
          <LeaseYearTypeText type={type} style={[styles.typeText, styles.typeToggle]} />
        )}

        {onRemove ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("renter.removeYear")}
            style={styles.deleteButton}
          >
            <Icon name="trash" size={ICON_SM} color={colors.error} />
          </Pressable>
        ) : null}
      </View>
    </View>
    </View>
  );
}

export const LeaseYearRow = React.memo(LeaseYearRowInner);

/** Every control in a row is this tall, so the side columns centre on the amount line. */
const LINE_HEIGHT = 48;

const styles = StyleSheet.create({
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  yearCol: {
    width: 52,
    minHeight: LINE_HEIGHT,
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 4,
  },
  yearLabel: { fontSize: 15, fontWeight: "600" },
  yearLabelCurrent: { fontWeight: "800" },
  moneyCol: { flex: 1, minWidth: 0, gap: spacing.sm },
  amountBlock: {
    flexDirection: "row",
    minHeight: LINE_HEIGHT,
    alignItems: "center",
    gap: spacing.xs,
    // The field surface's horizontal padding plus its 1px border.
    paddingHorizontal: 15,
  },
  amountText: { fontSize: 16, fontWeight: "600" },
  actionsCol: { height: LINE_HEIGHT, alignItems: "center", gap: spacing.sm },
  typeToggle: { minWidth: 56, alignItems: "center" },
  typeChip: {
    alignItems: "center",
    gap: 4,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderRadius: 999,
  },
  pressed: { opacity: 0.5 },
  typeText: { fontSize: 13, textAlign: "center" },
  ruleDropdown: { marginBottom: 0 },
  ruleValue: { marginBottom: 0 },
  ruleValueBox: { flex: 1 },
  errorText: { fontSize: 12 },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  chipOutlined: { borderWidth: 1, paddingVertical: 1 },
  chipText: { fontSize: 11, fontWeight: "700" },
  deleteButton: { padding: 4 },
});
