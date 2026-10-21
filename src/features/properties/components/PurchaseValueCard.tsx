import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, Text, useTheme } from "react-native-paper";
import { useController, type Control, type FieldValues } from "react-hook-form";
import type { TFunction } from "i18next";
import {
  FormSectionCard,
  FormNumericField,
  FormRow,
  FormWheelDateField,
} from "@/src/shared/components/form";
import { currencySymbol, formatDate, formatMoney } from "@/src/shared/utils/money";
import { darkColors, lightColors, spacing, ICON_MD } from "@/src/core/theme";
import { Icon } from "@/src/shared/components/ui";

type PurchaseValueCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  /** The value shown: the entry about to be saved if there is one, else the stored current value. */
  currentValue: number | null;
  currentValueDate: string | null;
  /** Whether `currentValue` is a new entry that the save will add. */
  pending: boolean;
  onAddValue: () => void;
};

/**
 * What was paid, when, and what the property is worth now.
 *
 * The value is not a form field: each "+" adds an entry to the property's value history,
 * kept by the form and sent with the save, so earlier values are never overwritten.
 */
function PurchaseValueCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  currentValue,
  currentValueDate,
  pending,
  onAddValue,
}: PurchaseValueCardProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  // The wheel picker has no way back to "no date", and the date is optional.
  const { field: purchaseDate } = useController({ control, name: "purchaseDate" as any });

  return (
    <FormSectionCard title={t("property.valueSection")}>
      {/* The price and the date are one fact - the purchase - so they share a row. */}
      <FormRow>
        <FormNumericField
          control={control}
          name={"purchasePrice" as any}
          label={`${t("property.purchasePrice")} (${currencySymbol()})`}
          keyboardType="decimal-pad"
        />
        <View>
          <FormWheelDateField
            control={control}
            name={"purchaseDate" as any}
            label={t("property.purchaseDate")}
            mode="full"
            minYear={1950}
            maxYear={new Date().getFullYear()}
          />
          {purchaseDate.value ? (
            <Button
              mode="text"
              compact
              onPress={() => purchaseDate.onChange("")}
              style={styles.clearDate}
            >
              {t("common.remove")}
            </Button>
          ) : null}
        </View>
      </FormRow>

      <View style={styles.valueBlock}>
        <Text variant="labelMedium" style={{ color: colors.textPrimary }}>
          {t("property.currentValue")}
        </Text>
        <View
          style={[
            styles.valueBox,
            { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground },
          ]}
        >
          <View style={styles.valueText}>
            {currentValue != null ? (
              <>
                <Text variant="bodyLarge" style={[styles.amount, { color: colors.textPrimary }]}>
                  {formatMoney(currentValue)}
                </Text>
                {currentValueDate ? (
                  <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                    {t("property.valueAsOf", { date: formatDate(currentValueDate) })}
                  </Text>
                ) : null}
                {pending ? (
                  <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                    {t("property.valuePending")}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                {t("property.noCurrentValue")}
              </Text>
            )}
          </View>
          <IconButton
            mode="contained"
            containerColor={colors.primary}
            icon={() => <Icon name="plus" size={ICON_MD} color={colors.onPrimary} />}
            onPress={onAddValue}
            accessibilityLabel={t("property.addValue")}
          />
        </View>
      </View>
    </FormSectionCard>
  );
}

const styles = StyleSheet.create({
  clearDate: {
    alignSelf: "flex-end",
    marginTop: -spacing.sm,
  },
  valueBlock: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  valueBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingStart: spacing.md,
    paddingVertical: spacing.xs,
  },
  valueText: {
    flex: 1,
  },
  amount: {
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});

export const PurchaseValueCard = React.memo(PurchaseValueCardInner) as typeof PurchaseValueCardInner;
