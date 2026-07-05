import React from "react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { StyleSheet, View, TextInput as RNTextInput } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { TFunction } from "i18next";
import { darkColors, lightColors, spacing, ICON_SM } from "@/src/core/theme";
import { useLanguageContext, useRtlInputStyle } from "@/src/core/context";
import type { LeaseYearType, RentEscalationMode } from "@/src/shared/types";
import { getLeaseYearLabel, isCurrentLeaseYear } from "@/src/shared/utils/leaseYear";
import { buildLeaseYears } from "@/src/shared/utils/leaseSchedule";
import { formatDateFull } from "@/src/shared/utils/dates";
import { Stepper, SegmentedControl, Icon, type Segment } from "@/src/shared/components/ui";
import { FormNumericField } from "./FormFields";
import { EscalationValueField } from "./EscalationValueField";
import { LeaseYearTypeText } from "./LeaseYearTypeText";

type LeaseTermBuilderProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
};

type LeaseYearRow = { amount?: string; type?: LeaseYearType };

function LeaseTermBuilderInner<TFieldValues extends FieldValues>({
  control,
  t,
}: LeaseTermBuilderProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const rtlInputStyle = useRtlInputStyle();

  const contractStr = useWatch({ control, name: "contractTermYears" as any }) as string | undefined;
  const optionStr = useWatch({ control, name: "optionYears" as any }) as string | undefined;
  const baseRentStr = useWatch({ control, name: "baseRent" as any }) as string | undefined;
  const escMode =
    (useWatch({ control, name: "escalationMode" as any }) as RentEscalationMode | undefined) ?? "none";
  const escValStr = useWatch({ control, name: "escalationValue" as any }) as string | undefined;
  const leaseStart = useWatch({ control, name: "leaseStart" as any }) as string | undefined;
  const leaseYears =
    (useWatch({ control, name: "leaseYears" as any }) as LeaseYearRow[] | undefined) ?? [];

  // Latest rows without making them an effect dependency (avoids regenerate loops
  // and lets "custom" mode preserve per-year amounts the user typed).
  const leaseYearsRef = React.useRef(leaseYears);
  leaseYearsRef.current = leaseYears;

  // Set when the user actively switches *into* CPI via the escalation control (never
  // on edit-hydration, which flows through form reset()). Signals the effect to drop
  // the outgoing mode's amounts and project the flat base instead of preserving them.
  const cpiSwitchRef = React.useRef(false);

  const { replace } = useFieldArray({ control, name: "leaseYears" as any });

  // Materialize the lease_years array whenever the term intent changes. Length and
  // types always follow the steppers; amounts are formula-driven except in
  // "custom" mode, where existing per-year amounts are preserved.
  React.useEffect(() => {
    const resetCpiAmounts = cpiSwitchRef.current;
    cpiSwitchRef.current = false;
    const next = buildLeaseYears(
      {
        contractYears: Number(contractStr) || 0,
        optionYears: Number(optionStr) || 0,
        baseRent: Number(baseRentStr) || 0,
        escalationMode: escMode,
        escalationValue: Number(escValStr) || 0,
      },
      leaseYearsRef.current.map((r) => ({
        amount: Number(r?.amount) || 0,
        type: r?.type ?? "contract",
      })),
      { resetCpiAmounts },
    );
    const current = leaseYearsRef.current;
    const same =
      next.length === current.length &&
      next.every(
        (n, i) =>
          String(n.amount) === String(current[i]?.amount ?? "") && n.type === current[i]?.type,
      );
    if (!same) {
      replace(next.map((y) => ({ amount: String(y.amount), type: y.type })) as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractStr, optionStr, baseRentStr, escMode, escValStr]);

  const isCustom = escMode === "custom";

  const escalationSegments: Segment<RentEscalationMode>[] = [
    { value: "none", label: t("renter.rentChangeSame") },
    { value: "percent", label: t("renter.rentChangePercent") },
    { value: "fixed", label: t("renter.rentChangeFixed") },
    { value: "cpi", label: t("renter.rentChangeCpi") },
    { value: "custom", label: t("renter.rentChangeCustom") },
  ];

  const contractCount = Number(contractStr) || 0;
  let endDate: Date | null = null;
  if (leaseStart && contractCount > 0) {
    const s = new Date(leaseStart);
    if (!isNaN(s.getTime())) {
      endDate = new Date(s.getFullYear() + contractCount, s.getMonth(), s.getDate());
    }
  }

  // The app forces native RTL via I18nManager.forceRTL (see core/i18n), so a plain "row"
  // already lays children out right-to-left in Hebrew. Manually reversing double-flips it
  // back to LTR — which is why inputs/labels landed on the wrong side.
  const rowDirection = "row" as const;
  const total = leaseYears.length;

  const renderNowChip = () => (
    <View style={[styles.nowChip, { backgroundColor: colors.accent }]}>
      <Text style={[styles.nowChipText, { color: colors.accentFg }]}>
        {t("renter.currentYear")}
      </Text>
    </View>
  );

  return (
    <View>
      <Controller
        control={control}
        name={"contractTermYears" as Path<TFieldValues>}
        render={({ field }) => (
          <Stepper
            label={t("renter.contractTerm")}
            unitLabel={t("renter.yearsUnit")}
            min={0}
            max={20}
            value={Number(field.value) || 0}
            onChange={(v) => field.onChange(String(v))}
          />
        )}
      />

      <Controller
        control={control}
        name={"optionYears" as Path<TFieldValues>}
        render={({ field }) => (
          <Stepper
            label={t("renter.renewalOptions")}
            unitLabel={t("renter.yearsUnit")}
            min={0}
            max={10}
            value={Number(field.value) || 0}
            onChange={(v) => field.onChange(String(v))}
          />
        )}
      />

      <FormNumericField
        control={control}
        name={"baseRent" as Path<TFieldValues>}
        label={t("renter.firstYearRent")}
        keyboardType="decimal-pad"
      />

      <Controller
        control={control}
        name={"escalationMode" as Path<TFieldValues>}
        render={({ field }) => (
          <SegmentedControl
            label={t("renter.rentChange")}
            segments={escalationSegments}
            fitContent
            value={(field.value as RentEscalationMode) ?? "none"}
            onChange={(v) => {
              if (v === "cpi") cpiSwitchRef.current = true;
              field.onChange(v);
            }}
          />
        )}
      />

      {escMode === "cpi" ? (
        <Text style={[styles.cpiNote, { color: colors.textSecondary }]}>
          {t("renter.rentChangeCpiNote")}
        </Text>
      ) : null}

      {escMode === "percent" || escMode === "fixed" ? (
        <Controller
          control={control}
          name={"escalationValue" as Path<TFieldValues>}
          render={({ field }) => (
            <EscalationValueField
              mode={escMode}
              value={(field.value as string) ?? ""}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      ) : null}

      {total > 0 ? (
        <View>
          <View style={[styles.divider, { backgroundColor: colors.outline }]} />
          <Text variant="bodyMedium" style={[styles.timelineTitle, { color: colors.textPrimary }]}>
            {t("renter.leaseTimeline")}
          </Text>

          {leaseYears.map((row, index) => {
            const isCurrent = isCurrentLeaseYear(leaseStart, index);
            const yearType: LeaseYearType = row?.type ?? "contract";
            const amountNum = Number(row?.amount) || 0;
            const isFirst = index === 0;
            const isLast = index === total - 1;
            // Year 1 is the known base; later CPI years are index-linked projections.
            const isCpiProjected = escMode === "cpi" && index > 0;

            const nodeStyle =
              isCurrent
                ? [styles.node, styles.nodeCurrent, { backgroundColor: colors.accent }]
                : yearType === "option"
                ? [styles.node, { borderWidth: 2, borderColor: colors.primary, backgroundColor: "transparent" }]
                : [styles.node, { backgroundColor: colors.primary }];

            return (
              <View
                key={index}
                style={[
                  styles.timelineRow,
                  { flexDirection: rowDirection },
                  isCurrent && { backgroundColor: colors.accent + "14" },
                ]}
              >
                <View style={styles.rail}>
                  <View
                    style={[styles.railLine, { backgroundColor: isFirst ? "transparent" : colors.outline }]}
                  />
                  <View style={nodeStyle} />
                  <View
                    style={[styles.railLine, { backgroundColor: isLast ? "transparent" : colors.outline }]}
                  />
                </View>

                {isCustom ? (
                  <View
                    style={[styles.rowContent, styles.previewContent, { flexDirection: rowDirection }]}
                  >
                    <Text
                      style={[
                        styles.previewYear,
                        { color: colors.textPrimary },
                        isCurrent && styles.previewYearCurrent,
                      ]}
                    >
                      {getLeaseYearLabel(leaseStart, index)}
                    </Text>
                    <Controller
                      control={control}
                      name={`leaseYears.${index}.amount` as Path<TFieldValues>}
                      render={({ field }) => (
                        <RNTextInput
                          value={(field.value as string) ?? ""}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={colors.textSecondary}
                          style={[
                            styles.inlineAmount,
                            {
                              borderColor: colors.outline,
                              backgroundColor: colors.inputFilledBackground,
                              color: colors.textPrimary,
                            },
                            rtlInputStyle,
                          ]}
                        />
                      )}
                    />
                    <LeaseYearTypeText type={yearType} />
                    {isCurrent ? renderNowChip() : null}
                  </View>
                ) : (
                  <View
                    style={[styles.rowContent, styles.previewContent, { flexDirection: rowDirection }]}
                  >
                    <Text
                      style={[
                        styles.previewYear,
                        { color: colors.textPrimary },
                        isCurrent && styles.previewYearCurrent,
                      ]}
                    >
                      {getLeaseYearLabel(leaseStart, index)}
                    </Text>
                    <View style={[styles.previewAmount, styles.amountRow, { flexDirection: rowDirection }]}>
                      {/* CPI amounts past year 1 are index-linked projections the
                          client can't know exactly — mark them approximate/muted. */}
                      <Text
                        style={[
                          styles.previewAmountText,
                          { color: isCpiProjected ? colors.textSecondary : colors.textPrimary },
                        ]}
                      >
                        {amountNum > 0
                          ? `${isCpiProjected ? "≈ " : ""}₪${amountNum.toLocaleString()}`
                          : "—"}
                      </Text>
                      {isCpiProjected ? (
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
                    <LeaseYearTypeText type={yearType} />
                    {isCurrent ? renderNowChip() : null}
                  </View>
                )}
              </View>
            );
          })}

          {endDate ? (
            <View style={[styles.endRow, { flexDirection: rowDirection }]}>
              <Icon name="calendar-clock" size={ICON_SM} color={colors.textSecondary} />
              <Text style={[styles.endDate, { color: colors.textSecondary }]}>
                {t("renter.leaseEnd", { date: formatDateFull(endDate, language) })}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export const LeaseTermBuilder = React.memo(
  LeaseTermBuilderInner,
) as typeof LeaseTermBuilderInner;

const styles = StyleSheet.create({
  cpiNote: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  timelineTitle: {
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  timelineRow: {
    alignItems: "stretch",
    paddingHorizontal: spacing.xs,
  },
  rail: {
    width: 24,
    alignItems: "center",
  },
  railLine: {
    width: 2,
    flex: 1,
  },
  node: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginVertical: 2,
  },
  nodeCurrent: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  rowContent: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  previewContent: {
    alignItems: "center",
    gap: spacing.sm,
  },
  previewYear: {
    fontWeight: "600",
    fontSize: 15,
    minWidth: 52,
  },
  previewYearCurrent: {
    fontWeight: "800",
  },
  previewAmount: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  amountRow: {
    alignItems: "center",
    gap: spacing.xs,
  },
  previewAmountText: {
    fontSize: 15,
    fontWeight: "600",
  },
  cpiChip: {
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  cpiChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  nowChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  nowChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  inlineAmount: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 0,
    height: 40,
    fontSize: 15,
  },
  endRow: {
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  endDate: {
    fontSize: 13,
  },
});
