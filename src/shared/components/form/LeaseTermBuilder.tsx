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

  const contractCount = Number(contractStr) || 0;
  let endDate: Date | null = null;
  if (leaseStart && contractCount > 0) {
    const s = new Date(leaseStart);
    if (!isNaN(s.getTime())) {
      endDate = new Date(s.getFullYear() + contractCount, s.getMonth(), s.getDate());
    }
  }

  const rowDirection = isRtl ? "row-reverse" : "row";
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
            value={(field.value as RentEscalationMode) ?? "none"}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />

      {escMode === "percent" || escMode === "fixed" ? (
        <View style={[styles.escValueRow, { flexDirection: rowDirection }]}>
          <Text style={[styles.escCaption, { color: colors.textSecondary }]}>
            {t("renter.yearlyIncrease")}
          </Text>
          <Controller
            control={control}
            name={"escalationValue" as Path<TFieldValues>}
            render={({ field }) => (
              <View
                style={[
                  styles.affixInput,
                  {
                    flexDirection: rowDirection,
                    borderColor: colors.outline,
                    backgroundColor: colors.inputFilledBackground,
                  },
                ]}
              >
                {escMode === "fixed" ? (
                  <Text style={[styles.affix, { color: colors.textSecondary }]}>₪</Text>
                ) : null}
                <RNTextInput
                  value={(field.value as string) ?? ""}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.affixField, { color: colors.textPrimary }, rtlInputStyle]}
                />
                {escMode === "percent" ? (
                  <Text style={[styles.affix, { color: colors.textSecondary }]}>%</Text>
                ) : null}
              </View>
            )}
          />
        </View>
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
                    <Text
                      style={[
                        styles.typeText,
                        {
                          color: yearType === "option" ? colors.accent : colors.textSecondary,
                          fontWeight: yearType === "option" ? "700" : "600",
                        },
                      ]}
                    >
                      {yearType === "contract"
                        ? t("renter.leaseYearTypeContract")
                        : t("renter.leaseYearTypeOption")}
                    </Text>
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
                    <Text style={[styles.previewAmount, { color: colors.textPrimary }]}>
                      {amountNum > 0 ? `₪${amountNum.toLocaleString()}` : "—"}
                    </Text>
                    <Text
                      style={[
                        styles.typeText,
                        {
                          color: yearType === "option" ? colors.accent : colors.textSecondary,
                          fontWeight: yearType === "option" ? "700" : "600",
                        },
                      ]}
                    >
                      {yearType === "contract"
                        ? t("renter.leaseYearTypeContract")
                        : t("renter.leaseYearTypeOption")}
                    </Text>
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
  escValueRow: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  escCaption: {
    fontSize: 13,
  },
  affixInput: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    width: 130,
    gap: 6,
  },
  affixField: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  affix: {
    fontSize: 16,
    fontWeight: "600",
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
  typeText: {
    fontSize: 13,
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
