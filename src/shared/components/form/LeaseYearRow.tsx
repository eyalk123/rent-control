import React from "react";
import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { darkColors, lightColors, spacing, ICON_SM } from "@/src/core/theme";
import { Icon } from "@/src/shared/components/ui";
import { formatMoney } from "@/src/shared/utils/money";
import type { LeaseYearRuleMode, LeaseYearType } from "@/src/shared/types";
import { LeaseYearAmountField } from "./LeaseYearAmountField";
import { LeaseYearTypeText } from "./LeaseYearTypeText";
import { EscalationValueField } from "./EscalationValueField";
import { DropdownField } from "./DropdownField";

/**
 * The per-year rule options, in display order. Mirrors the whole-lease choices in
 * RENT_ESCALATION_MODES (minus `custom`, which has no meaning for a single year), plus
 * `manual` — the neutral default, meaning "this amount was typed, not derived".
 */
export const LEASE_YEAR_RULE_MODES: LeaseYearRuleMode[] = [
  "manual",
  "none",
  "percent",
  "fixed",
  "cpi",
];

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
  /** Editable amount when provided; a read-only formatted amount otherwise. */
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
  const showRuleValue = ruleMode === "percent" || ruleMode === "fixed";

  const ruleOptions = LEASE_YEAR_RULE_MODES.map((m) => ({
    value: m,
    label: t(LEASE_YEAR_RULE_LABEL_KEYS[m]),
  }));

  return (
    <View style={isCurrent ? { backgroundColor: colors.accent + "14", borderRadius: 8 } : undefined}>
    <View
      style={[
        styles.row,
        { flexDirection: rowDirection },
      ]}
    >
      <Text
        style={[styles.yearLabel, { color: colors.textPrimary }, isCurrent && styles.yearLabelCurrent]}
      >
        {label}
      </Text>

      {onAmountChange ? (
        <LeaseYearAmountField
          value={amount}
          onChangeText={onAmountChange}
          onBlur={onAmountBlur}
          placeholder={t("renter.amount")}
        />
      ) : (
        <View style={[styles.amountBlock, { flexDirection: rowDirection }]}>
          <Text
            style={[
              styles.amountText,
              { color: projected ? colors.textSecondary : colors.textPrimary },
            ]}
          >
            {amountNum > 0 ? `${projected ? "≈ " : ""}${formatMoney(amountNum)}` : "—"}
          </Text>
          {projected ? (
            <View
              style={[
                styles.cpiChip,
                { backgroundColor: colors.inputFilledBackground, flexDirection: rowDirection },
              ]}
            >
              <Icon name="trending-up" size={12} color={colors.textSecondary} />
              <Text style={[styles.cpiChipText, { color: colors.textSecondary }]}>
                {t("renter.rentChangeCpi")}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* An editable row shows the projection chip here — its amount lives in an input, so
          the read-only branch above (which owns the other chip) never renders. */}
      {onAmountChange && projected ? (
        <View
          style={[
            styles.cpiChip,
            { backgroundColor: colors.inputFilledBackground, flexDirection: rowDirection },
          ]}
        >
          <Icon name="trending-up" size={12} color={colors.textSecondary} />
          <Text style={[styles.cpiChipText, { color: colors.textSecondary }]}>
            {t("renter.rentChangeCpi")}
          </Text>
        </View>
      ) : null}

      {onTypeToggle ? (
        <Pressable
          onPress={onTypeToggle}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t("renter.tapToChangeType")}
          style={styles.typeToggle}
        >
          <LeaseYearTypeText type={type} style={styles.typeText} />
        </Pressable>
      ) : (
        <LeaseYearTypeText type={type} style={[styles.typeText, styles.typeToggle]} />
      )}

      {isCurrent ? (
        <View style={[styles.chip, { backgroundColor: colors.accent }]}>
          <Text style={[styles.chipText, { color: colors.accentFg }]}>{t("renter.currentYear")}</Text>
        </View>
      ) : null}

      {badge}

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

    {/* The rule sits on its own line: a phone row has no space for year + amount + rule +
        value + type side by side. */}
    {onRuleChange ? (
      <View style={[styles.ruleRow, { flexDirection: rowDirection }]}>
        <DropdownField
          data={ruleOptions}
          value={ruleMode}
          onChange={(m) => onRuleChange(m as LeaseYearRuleMode)}
          inputStyle={styles.ruleDropdown}
        />
        {showRuleValue && onRuleValueChange ? (
          <EscalationValueField
            mode={ruleMode as "percent" | "fixed"}
            value={ruleValue}
            onChangeText={onRuleValueChange}
            onBlur={onRuleValueBlur}
            label=""
          />
        ) : null}
      </View>
    ) : null}

    {error ? (
      <Text style={[styles.errorText, { color: colors.error }]}>
        {t(error, { defaultValue: error })}
      </Text>
    ) : null}
    </View>
  );
}

export const LeaseYearRow = React.memo(LeaseYearRowInner);

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  yearLabel: { fontSize: 15, fontWeight: "600", minWidth: 52 },
  yearLabelCurrent: { fontWeight: "800" },
  amountBlock: { flex: 1, alignItems: "center", gap: spacing.xs },
  amountText: { fontSize: 15, fontWeight: "600" },
  cpiChip: {
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cpiChipText: { fontSize: 11, fontWeight: "700" },
  typeToggle: { minWidth: 56, alignItems: "center" },
  typeText: { fontSize: 13, textAlign: "center" },
  ruleRow: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    paddingStart: 52 + spacing.sm,
  },
  ruleDropdown: { minWidth: 120, height: 40 },
  errorText: { fontSize: 12, paddingHorizontal: spacing.xs, paddingBottom: spacing.xs, paddingStart: 52 + spacing.sm },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  chipText: { fontSize: 11, fontWeight: "700" },
  deleteButton: { padding: 4 },
});
