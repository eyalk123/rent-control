import React from "react";
import { StyleSheet, View } from "react-native";
import { Switch, Text, useTheme } from "react-native-paper";
import { useController, useWatch, type Control, type FieldValues } from "react-hook-form";
import type { TFunction } from "i18next";
import {
  FormSectionCard,
  FormNumericField,
  FormWheelDateField,
} from "@/src/shared/components/form";
import { currencySymbol } from "@/src/shared/utils/money";
import { useAlert } from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";

type MortgageFormCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  /** The stored property has a mortgage: turning the switch off will delete it on save. */
  hadMortgage: boolean;
};

/**
 * "This property has a mortgage", and the mortgage itself when it does.
 *
 * The switch is not a stored flag — it is on exactly when the property has a mortgage — so
 * every existing property starts with it off. Turning it off on a property that has one
 * deletes the mortgage and its payment history on save, which is asked first.
 */
function MortgageFormCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  hadMortgage,
}: MortgageFormCardProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { appAlert } = useAlert();
  const { field: hasMortgage } = useController({ control, name: "hasMortgage" as any });
  const { field: endDate } = useController({ control, name: "mortgageEndDate" as any });
  const on = !!useWatch({ control, name: "hasMortgage" as any });

  const toggle = (next: boolean) => {
    if (next || !hadMortgage) {
      hasMortgage.onChange(next);
      return;
    }
    appAlert(t("mortgage.turnOffTitle"), t("mortgage.turnOffMessage"), [
      { text: t("common.cancel"), style: "cancel", onPress: () => {} },
      { text: t("mortgage.turnOff"), style: "destructive", onPress: () => hasMortgage.onChange(false) },
    ]);
  };

  return (
    <FormSectionCard title={t("mortgage.section")}>
      <View style={styles.switchRow}>
        <Text variant="bodyLarge" style={[styles.switchLabel, { color: colors.textPrimary }]}>
          {t("mortgage.switchLabel")}
        </Text>
        <Switch value={on} onValueChange={toggle} accessibilityLabel={t("mortgage.switchLabel")} />
      </View>
      {on ? (
        <>
          <View>
            <FormNumericField
              control={control}
              name={"mortgagePayment" as any}
              label={`${t("mortgage.monthlyPayment")} (${currencySymbol()})`}
              keyboardType="decimal-pad"
              required
            />
            <Text variant="bodySmall" style={[styles.note, { color: colors.textSecondary }]}>
              {hadMortgage ? t("mortgage.formEditNote") : t("mortgage.formAmountNote")}
            </Text>
          </View>
          <View>
            <FormNumericField
              control={control}
              name={"mortgageChargeDay" as any}
              label={t("mortgage.chargeDay")}
              keyboardType="number-pad"
              required
            />
            <Text variant="bodySmall" style={[styles.note, { color: colors.textSecondary }]}>
              {t("mortgage.chargeDayHint")}
            </Text>
          </View>
          <FormWheelDateField
            control={control}
            name={"mortgageEndDate" as any}
            label={t("mortgage.endDateOptional")}
            mode="full"
            minYear={new Date().getFullYear() - 5}
            maxYear={new Date().getFullYear() + 40}
          />
          {/* The wheel picker has no way back to "no date", and the date is optional. */}
          {endDate.value ? (
            <Text
              variant="labelLarge"
              onPress={() => endDate.onChange("")}
              style={[styles.clear, { color: colors.primary }]}
            >
              {t("mortgage.clearEndDate")}
            </Text>
          ) : null}
        </>
      ) : null}
    </FormSectionCard>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  switchLabel: {
    flex: 1,
  },
  note: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  clear: {
    alignSelf: "flex-end",
    paddingVertical: spacing.xs,
  },
});

export const MortgageFormCard = React.memo(MortgageFormCardInner) as typeof MortgageFormCardInner;
