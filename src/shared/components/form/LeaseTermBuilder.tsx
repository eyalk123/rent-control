import React from "react";
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { TFunction } from "i18next";
import { darkColors, lightColors, spacing, ICON_SM } from "@/src/core/theme";
import { useLanguageContext } from "@/src/core/context";
import type { LeaseYearType, RentEscalationMode } from "@/src/shared/types";
import { getLeaseYearLabel, isCurrentLeaseYear } from "@/src/shared/utils/leaseYear";
import { buildLeaseYears } from "@/src/shared/utils/leaseSchedule";
import { formatDateFull } from "@/src/shared/utils/dates";
import { Stepper, Icon } from "@/src/shared/components/ui";
import { FormNumericField } from "./FormFields";
import { RentChangeField } from "./RentChangeField";
import { LeaseYearRow } from "./LeaseYearRow";

type LeaseTermBuilderProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
};

type LeaseYearRowValue = { amount?: string; type?: LeaseYearType };

function LeaseTermBuilderInner<TFieldValues extends FieldValues>({
  control,
  t,
}: LeaseTermBuilderProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();

  const contractStr = useWatch({ control, name: "contractTermYears" as any }) as string | undefined;
  const optionStr = useWatch({ control, name: "optionYears" as any }) as string | undefined;
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
        <View>
          <View style={[styles.divider, { backgroundColor: colors.outline }]} />
          <Text variant="bodyMedium" style={[styles.timelineTitle, { color: colors.textPrimary }]}>
            {t("renter.leaseTimeline")}
          </Text>

          {leaseYears.map((row, index) => {
            const yearType: LeaseYearType = row?.type ?? "contract";
            // Year 1 is the known base; later CPI years are index-linked projections.
            const isCpiProjected = escMode === "cpi" && index > 0;

            return isCustom ? (
              <Controller
                key={index}
                control={control}
                name={`leaseYears.${index}.amount` as Path<TFieldValues>}
                render={({ field }) => (
                  <LeaseYearRow
                    label={getLeaseYearLabel(leaseStart, index)}
                    amount={(field.value as string) ?? ""}
                    type={yearType}
                    isCurrent={isCurrentLeaseYear(leaseStart, index)}
                    onAmountChange={field.onChange}
                    onAmountBlur={field.onBlur}
                    rowDirection={rowDirection}
                  />
                )}
              />
            ) : (
              <LeaseYearRow
                key={index}
                label={getLeaseYearLabel(leaseStart, index)}
                amount={String(row?.amount ?? "")}
                type={yearType}
                isCurrent={isCurrentLeaseYear(leaseStart, index)}
                projected={isCpiProjected}
                rowDirection={rowDirection}
              />
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
});
