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
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useLanguageContext } from "@/src/core/context";
import type { LeaseYearType, RentEscalationMode } from "@/src/shared/types";
import { getLeaseYearLabel, isCurrentLeaseYear } from "@/src/shared/utils/leaseYear";
import { buildLeaseYears } from "@/src/shared/utils/leaseSchedule";
import { formatDateFull } from "@/src/shared/utils/dates";
import { Stepper, SegmentedControl, type Segment } from "@/src/shared/components/ui";
import { FormNumericField } from "./FormFields";

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
  const { isRtl, language } = useLanguageContext();

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

  const { replace } = useFieldArray({ control, name: "leaseYears" as any });

  // Materialize the lease_years array whenever the term intent changes. Length and
  // types always follow the steppers; amounts are formula-driven except in
  // "custom" mode, where existing per-year amounts are preserved.
  React.useEffect(() => {
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
    { value: "custom", label: t("renter.rentChangeCustom") },
  ];

  const typeSegments: Segment<LeaseYearType>[] = [
    { value: "contract", label: t("renter.leaseYearTypeContract") },
    { value: "option", label: t("renter.leaseYearTypeOption") },
  ];

  const contractCount = Number(contractStr) || 0;
  let endDate: Date | null = null;
  if (leaseStart && contractCount > 0) {
    const s = new Date(leaseStart);
    if (!isNaN(s.getTime())) {
      endDate = new Date(s.getFullYear() + contractCount, s.getMonth(), s.getDate());
    }
  }

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.outline, backgroundColor: theme.colors.surfaceVariant },
      ]}
    >
      <Controller
        control={control}
        name={"contractTermYears" as Path<TFieldValues>}
        render={({ field }) => (
          <Stepper
            label={t("renter.contractTerm")}
            unitLabel={t("renter.yearsUnit")}
            quickValues={[1, 2, 3]}
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
            value={(field.value as RentEscalationMode) ?? "none"}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />

      {escMode === "percent" || escMode === "fixed" ? (
        <FormNumericField
          control={control}
          name={"escalationValue" as Path<TFieldValues>}
          label={
            escMode === "percent"
              ? t("renter.escalationValuePercent")
              : t("renter.escalationValueFixed")
          }
          keyboardType="decimal-pad"
        />
      ) : null}

      {leaseYears.length > 0 ? (
        <View style={styles.timeline}>
          <Text
            variant="bodyMedium"
            style={[styles.timelineTitle, { color: colors.textPrimary }]}
          >
            {t("renter.leaseTimeline")}
          </Text>

          {leaseYears.map((row, index) => {
            const isCurrent = isCurrentLeaseYear(leaseStart, index);
            const yearType: LeaseYearType = row?.type ?? "contract";
            const amountNum = Number(row?.amount) || 0;

            if (isCustom) {
              return (
                <View
                  key={`custom-${index}`}
                  style={[
                    styles.customRow,
                    {
                      borderColor: colors.outline,
                      backgroundColor: isCurrent ? colors.primary + "22" : colors.cardBackground,
                    },
                  ]}
                >
                  <Text style={[styles.yearLabel, { color: colors.textPrimary }]}>
                    {getLeaseYearLabel(leaseStart, index)}
                  </Text>
                  <View style={styles.customInputs}>
                    <View style={styles.customAmount}>
                      <FormNumericField
                        control={control}
                        name={`leaseYears.${index}.amount` as Path<TFieldValues>}
                        label={t("renter.leaseYearAmount")}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <Controller
                      control={control}
                      name={`leaseYears.${index}.type` as Path<TFieldValues>}
                      render={({ field }) => (
                        <View style={styles.customType}>
                          <SegmentedControl
                            segments={typeSegments}
                            value={(field.value as LeaseYearType) ?? "contract"}
                            onChange={(v) => field.onChange(v)}
                          />
                        </View>
                      )}
                    />
                  </View>
                </View>
              );
            }

            return (
              <View
                key={`preview-${index}`}
                style={[
                  styles.previewRow,
                  {
                    flexDirection: isRtl ? "row-reverse" : "row",
                    borderColor: colors.outline,
                    backgroundColor: isCurrent ? colors.primary + "22" : colors.cardBackground,
                  },
                ]}
              >
                <Text style={[styles.previewYear, { color: colors.textPrimary }]}>
                  {getLeaseYearLabel(leaseStart, index)}
                </Text>
                <Text style={[styles.previewAmount, { color: colors.textPrimary }]}>
                  {amountNum > 0 ? `₪${amountNum.toLocaleString()}` : "—"}
                </Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        yearType === "contract" ? colors.primary : colors.secondary,
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.onPrimary }]}>
                    {yearType === "contract"
                      ? t("renter.leaseYearTypeContract")
                      : t("renter.leaseYearTypeOption")}
                  </Text>
                </View>
              </View>
            );
          })}

          {endDate ? (
            <Text style={[styles.endDate, { color: colors.textSecondary }]}>
              {t("renter.leaseEnd", { date: formatDateFull(endDate, language) })}
            </Text>
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
  container: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  timeline: {
    marginTop: spacing.xs,
  },
  timelineTitle: {
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  previewRow: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  previewYear: {
    fontWeight: "700",
    fontSize: 15,
    minWidth: 52,
  },
  previewAmount: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  customRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  yearLabel: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: spacing.xs,
  },
  customInputs: {
    gap: spacing.xs,
  },
  customAmount: {
    width: "100%",
  },
  customType: {
    width: "100%",
  },
  endDate: {
    marginTop: spacing.xs,
    fontSize: 13,
    fontStyle: "italic",
  },
});
