import React from "react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormSetValue,
} from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { TFunction } from "i18next";
import { darkColors, lightColors, spacing, ICON_SM } from "@/src/core/theme";
import { useLanguageContext } from "@/src/core/context";
import type {
  LeaseYear,
  LeaseYearRuleMode,
  LeaseYearType,
  RentEscalationMode,
} from "@/src/shared/types";
import { getLeaseYearLabel, isCurrentLeaseYear } from "@/src/shared/utils/leaseYear";
import { buildLeaseYears, isProjectedYear } from "@/src/shared/utils/leaseSchedule";
import { addMonths, periodMonths } from "@/src/shared/types";
import { formatDateFull } from "@/src/shared/utils/dates";
import { Stepper, Icon } from "@/src/shared/components/ui";
import { FormNumericField } from "./FormFields";
import { RentChangeField } from "./RentChangeField";
import { LeaseYearRow } from "./LeaseYearRow";
import { ANCHORS } from "@/src/features/onboarding/anchors";
import { TourAnchor, useTourAnchor } from "@/src/features/onboarding/AnchorRegistry";

type LeaseTermBuilderProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  /** Needed so editing year one's amount keeps the "first-year rent" field in step with it. */
  setValue: UseFormSetValue<TFieldValues>;
};

/**
 * Form-state shape of a lease year: numbers live as strings while the user types.
 * `rule.value` is always present (possibly '') — the Zod schema coerces it that way.
 */
type LeaseYearRowValue = {
  amount?: string;
  type?: LeaseYearType;
  rule?: { mode: LeaseYearRuleMode; value: string };
  /** Absent means twelve. Set by the steppers, never typed directly. */
  months?: number;
};

/** Form rows -> the numeric model the schedule helpers work on. */
function toModel(rows: LeaseYearRowValue[]): LeaseYear[] {
  return rows.map((r) => {
    const year: LeaseYear = {
      amount: Number(r?.amount) || 0,
      type: r?.type ?? "contract",
    };
    // "manual" is the absence of a rule — don't carry it into the model or the payload.
    if (r?.rule && r.rule.mode !== "manual") {
      year.rule = { mode: r.rule.mode, value: Number(r.rule.value) || 0 };
    }
    // Absent means twelve, so a full-year period never carries the field — which keeps
    // an ordinary lease's payload identical to what it has always been.
    if (r?.months && r.months < 12) year.months = r.months;
    return year;
  });
}

function LeaseTermBuilderInner<TFieldValues extends FieldValues>({
  control,
  t,
  setValue,
}: LeaseTermBuilderProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();

  const contractStr = useWatch({ control, name: "contractTermYears" as any }) as string | undefined;
  const contractMonthsStr = useWatch({ control, name: "contractTermMonths" as any }) as string | undefined;
  const optionStr = useWatch({ control, name: "optionYears" as any }) as string | undefined;
  const optionMonthsStr = useWatch({ control, name: "optionTermMonths" as any }) as string | undefined;
  const baseRentStr = useWatch({ control, name: "baseRent" as any }) as string | undefined;
  const escMode =
    (useWatch({ control, name: "escalationMode" as any }) as RentEscalationMode | undefined) ?? "none";
  const escValStr = useWatch({ control, name: "escalationValue" as any }) as string | undefined;
  const leaseStart = useWatch({ control, name: "leaseStart" as any }) as string | undefined;
  const leaseYears =
    (useWatch({ control, name: "leaseYears" as any }) as LeaseYearRowValue[] | undefined) ?? [];

  // Latest rows without making them an effect dependency (avoids regenerate loops
  // and lets "custom" mode preserve per-year amounts the user typed).
  const leaseYearsRef = React.useRef(leaseYears);
  leaseYearsRef.current = leaseYears;

  // Set when the user actively switches *into* CPI via the escalation control (never
  // on edit-hydration, which flows through form reset()). Signals the effect to drop
  // the outgoing mode's amounts and project the flat base instead of preserving them.
  const cpiSwitchRef = React.useRef(false);

  const { replace } = useFieldArray({ control, name: "leaseYears" as any });

  const isCustom = escMode === "custom";

  // Re-run the effect when a per-year rule changes (custom mode) so the walk re-prices the
  // ruled years, and when an amount changes so a hand-typed ("manual") year recascades the
  // ruled years below it. Writing back is what makes the amount dependency safe: only a year
  // whose amount changed *numerically* is rewritten, so a half-typed field is left alone.
  const rulesKey = JSON.stringify(leaseYears.map((r) => r?.rule ?? null));
  const amountsKey = leaseYears.map((r) => r?.amount ?? "").join("|");

  // Materialize the lease_years array whenever the term intent changes. Length and
  // types always follow the steppers; amounts are formula-driven except in "custom"
  // mode, where each year's own rule prices it off the year before it and hand-typed
  // ("manual") amounts are preserved.
  React.useEffect(() => {
    const resetCpiAmounts = cpiSwitchRef.current;
    cpiSwitchRef.current = false;
    const current = leaseYearsRef.current;
    const next = buildLeaseYears(
      {
        contractYears: Number(contractStr) || 0,
        contractMonths: Number(contractMonthsStr) || 0,
        optionYears: Number(optionStr) || 0,
        optionMonths: Number(optionMonthsStr) || 0,
        baseRent: Number(baseRentStr) || 0,
        escalationMode: escMode,
        escalationValue: Number(escValStr) || 0,
      },
      toModel(current),
      { resetCpiAmounts },
    );

    // Rebuilding the whole array remounts every row, so reserve it for changes that really
    // are structural (the steppers adding/removing years, or leaving custom mode with rules
    // still attached). Amount-only changes go through setValue on the leaf below — a replace()
    // there would tear down the rule inputs mid-keystroke and steal focus.
    const structureChanged =
      next.length !== current.length ||
      next.some(
        (y, i) => y.type !== current[i]?.type || (y.months ?? 12) !== (current[i]?.months ?? 12),
      );
    const staleRules = !isCustom && current.some((r) => r?.rule);

    if (structureChanged || staleRules) {
      replace(
        next.map((y, i) => ({
          amount: String(y.amount),
          type: y.type,
          ...(y.months ? { months: y.months } : {}),
          // buildLeaseYears only returns a rule in custom mode, so this drops them on exit.
          ...(y.rule && current[i]?.rule ? { rule: current[i]!.rule } : {}),
        })) as any,
      );
      return;
    }

    // Write only the amounts that actually changed *numerically* — comparing strings would
    // rewrite "" as "0" and fight the user's cursor mid-typing.
    next.forEach((y, i) => {
      if ((Number(current[i]?.amount) || 0) !== y.amount) {
        setValue(
          `leaseYears.${i}.amount` as Path<TFieldValues>,
          String(y.amount) as PathValue<TFieldValues, Path<TFieldValues>>,
          { shouldDirty: true },
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contractStr,
    contractMonthsStr,
    optionStr,
    optionMonthsStr,
    baseRentStr,
    escMode,
    escValStr,
    rulesKey,
    amountsKey,
  ]);

  /** Rows in the numeric model, for deriving which years render as projections. */
  const modelRows = toModel(leaseYears);

  // Summed from the periods rather than the year stepper, so a short tail counts — and
  // so the option periods do too, which the old arithmetic silently dropped.
  let endDate: Date | null = null;
  if (leaseStart && modelRows.length > 0) {
    const s = new Date(leaseStart);
    if (!isNaN(s.getTime())) {
      endDate = addMonths(s, modelRows.reduce((sum, y) => sum + periodMonths(y), 0));
    }
  }

  // The app forces native RTL via I18nManager.forceRTL (see core/i18n), so a plain "row"
  // already lays children out right-to-left in Hebrew. Manually reversing double-flips it
  // back to LTR — which is why inputs/labels landed on the wrong side.
  const rowDirection = "row" as const;
  const total = leaseYears.length;
  // Two anchors: the term steppers (lease-form tour) and the per-year list, which the
  // custom-mode elaboration points at once the user picks Custom.
  const termAnchorRef = useTourAnchor(ANCHORS.leaseTermBuilder);
  const yearRowsAnchorRef = useTourAnchor(ANCHORS.leaseYearRows);

  return (
    <View ref={termAnchorRef} collapsable={false}>
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
        name={"contractTermMonths" as Path<TFieldValues>}
        render={({ field }) => (
          <Stepper
            label={t("renter.extraMonths")}
            unitLabel={t("renter.monthsUnit")}
            min={0}
            max={11}
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

      <Controller
        control={control}
        name={"optionTermMonths" as Path<TFieldValues>}
        render={({ field }) => (
          <Stepper
            label={t("renter.extraOptionMonths")}
            unitLabel={t("renter.monthsUnit")}
            min={0}
            max={11}
            value={Number(field.value) || 0}
            onChange={(v) => field.onChange(String(v))}
          />
        )}
      />

      <TourAnchor id={ANCHORS.leaseBaseRent}>
        <FormNumericField
          control={control}
          name={"baseRent" as Path<TFieldValues>}
          label={t("renter.firstYearRent")}
          keyboardType="decimal-pad"
        />
      </TourAnchor>

      <Controller
        control={control}
        name={"escalationMode" as Path<TFieldValues>}
        render={({ field: modeField }) => (
          <Controller
            control={control}
            name={"escalationValue" as Path<TFieldValues>}
            render={({ field: valueField }) => (
              <RentChangeField
                label={t("renter.rentChange")}
                fitContent
                mode={(modeField.value as RentEscalationMode) ?? "none"}
                onModeChange={(v) => {
                  if (v === "cpi") cpiSwitchRef.current = true;
                  modeField.onChange(v);
                }}
                value={(valueField.value as string) ?? ""}
                onValueChange={valueField.onChange}
                onValueBlur={valueField.onBlur}
              />
            )}
          />
        )}
      />

      {total > 0 ? (
        <View ref={yearRowsAnchorRef} collapsable={false}>
          <View style={[styles.divider, { backgroundColor: colors.outline }]} />
          <Text variant="bodyMedium" style={[styles.timelineTitle, { color: colors.textPrimary }]}>
            {t("renter.leaseTimeline")}
          </Text>

          {leaseYears.map((row, index) => {
            const yearType: LeaseYearType = row?.type ?? "contract";
            // Year 1 is the known base; later CPI years are index-linked projections.
            const isCpiProjected = escMode === "cpi" && index > 0;

            return isCustom ? (
              // Two leaf Controllers rather than one on `leaseYears.${index}`: a Controller
              // bound to the item *object* doesn't re-render when the field array's value is
              // rewritten, so the recomputed amount never reaches the input.
              <Controller
                key={index}
                control={control}
                name={`leaseYears.${index}.amount` as Path<TFieldValues>}
                render={({ field: amountField }) => (
                  <Controller
                    control={control}
                    name={`leaseYears.${index}.rule` as Path<TFieldValues>}
                    render={({ field: ruleField, fieldState: ruleState }) => {
                      const rule = ruleField.value as LeaseYearRowValue["rule"];
                      const ruleMode = rule?.mode ?? "manual";
                      const ruleError = (
                        ruleState.error as { value?: { message?: string } } | undefined
                      )?.value?.message;

                      return (
                        <LeaseYearRow
                          label={getLeaseYearLabel(leaseStart, modelRows, index, language)}
                          amount={(amountField.value as string) ?? ""}
                          type={yearType}
                          isCurrent={isCurrentLeaseYear(leaseStart, modelRows, index)}
                          projected={isProjectedYear(modelRows, index)}
                          onAmountBlur={amountField.onBlur}
                          onAmountChange={(v) => {
                            amountField.onChange(v);
                            // Typing an amount means the stated rule no longer describes it —
                            // fall back to manual so the number and the rule can't disagree.
                            if (rule) ruleField.onChange(undefined);
                            // Year one *is* the first-year rent; keep the two in step, or the
                            // server (which prices year one off base_rent) would overwrite it.
                            if (index === 0) {
                              setValue(
                                "baseRent" as Path<TFieldValues>,
                                v as PathValue<TFieldValues, Path<TFieldValues>>,
                              );
                            }
                          }}
                          // Year one is the base rent, so it has nothing to derive from.
                          ruleMode={ruleMode}
                          onRuleChange={
                            index === 0
                              ? undefined
                              : (mode) =>
                                  ruleField.onChange(
                                    mode === "manual"
                                      ? undefined
                                      : { mode, value: rule?.value ?? "" },
                                  )
                          }
                          ruleValue={rule?.value ?? ""}
                          onRuleValueChange={(v) =>
                            ruleField.onChange({ mode: ruleMode, value: v })
                          }
                          error={ruleError}
                          rowDirection={rowDirection}
                        />
                      );
                    }}
                  />
                )}
              />
            ) : (
              <LeaseYearRow
                key={index}
                label={getLeaseYearLabel(leaseStart, modelRows, index, language)}
                amount={String(row?.amount ?? "")}
                type={yearType}
                isCurrent={isCurrentLeaseYear(leaseStart, modelRows, index)}
                projected={isCpiProjected}
                rowDirection={rowDirection}
              />
            );
          })}

          {isCustom && isProjectedYear(modelRows, modelRows.length - 1) ? (
            <Text style={[styles.projectedNote, { color: colors.textSecondary }]}>
              {t("renter.cpiProjectedNote")}
            </Text>
          ) : null}

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
  divider: {
    height: 1,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  timelineTitle: {
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  endRow: {
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  endDate: {
    fontSize: 13,
  },
  projectedNote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
