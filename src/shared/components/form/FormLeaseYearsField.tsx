import React from "react";
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { TFunction } from "i18next";
import { spacing } from "@/src/core/theme";
import { getLeaseYearLabel, isCurrentLeaseYear } from "@/src/shared/utils/leaseYear";
import { FormNumericField } from "./FormFields";
import { FormDropdownOptions } from "./FormDropdownOptions";

type FormLeaseYearsFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  yearsCountName: Path<TFieldValues>;
  leaseStart?: string;
  t: TFunction;
};

function FormLeaseYearsFieldInner<TFieldValues extends FieldValues>({
  control,
  name,
  yearsCountName,
  leaseStart,
  t,
}: FormLeaseYearsFieldProps<TFieldValues>) {
  const theme = useTheme();
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as any,
  });

  const yearsValue = useWatch({
    control,
    name: yearsCountName as any,
  });

  const syncRowsWithYears = React.useCallback(() => {
    const numeric = Number(yearsValue);
    const safeYears =
      Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 0;

    if (safeYears === 0) {
      if (fields.length > 0) {
        for (let i = fields.length - 1; i >= 0; i -= 1) {
          remove(i);
        }
      }
      return;
    }

    if (fields.length < safeYears) {
      const toAdd = safeYears - fields.length;
      for (let i = 0; i < toAdd; i += 1) {
        append({
          amount: "",
          type: "contract",
        } as any);
      }
    } else if (fields.length > safeYears) {
      const toRemove = fields.length - safeYears;
      for (let i = 0; i < toRemove; i += 1) {
        remove(fields.length - 1 - i);
      }
    }
  }, [append, fields.length, remove, yearsValue]);

  React.useEffect(() => {
    syncRowsWithYears();
  }, [syncRowsWithYears]);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surfaceVariant,
        },
      ]}
    >
      <FormNumericField
        control={control}
        name={yearsCountName}
        label={t("renter.contractYears")}
        keyboardType="number-pad"
      />

      <ScrollView
        style={styles.yearsScroll}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {[...fields].reverse().map((field, reversedIdx) => {
          const index = fields.length - 1 - reversedIdx;
          const isCurrent = isCurrentLeaseYear(leaseStart, index);
          return (
            <View
              key={field.id}
              style={[
                styles.row,
                isCurrent && { backgroundColor: theme.colors.primary + '4D', borderRadius: 6, paddingHorizontal: spacing.xs },
              ]}
            >
              <View style={styles.yearLabelRow}>
                <Text
                  variant="bodyMedium"
                  style={[styles.yearLabel, isCurrent && { color: '#C17F00' }]}
                >
                  {getLeaseYearLabel(leaseStart, index)}
                </Text>
              </View>
              <View style={styles.rowInputs}>
                <View style={styles.rowInput}>
                  <FormNumericField
                    control={control}
                    name={`${name}.${index}.amount` as Path<TFieldValues>}
                    label={t("renter.leaseYearAmount")}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.rowInput}>
                  <FormDropdownOptions
                    control={control}
                    name={`${name}.${index}.type` as Path<TFieldValues>}
                    label={t("renter.leaseYearType")}
                    options={[
                      {
                        value: "option",
                        label: t("renter.leaseYearTypeOption"),
                      },
                      {
                        value: "contract",
                        label: t("renter.leaseYearTypeContract"),
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export const FormLeaseYearsField = React.memo(
  FormLeaseYearsFieldInner,
) as typeof FormLeaseYearsFieldInner;

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: 0,
  },
  yearsScroll: {
    maxHeight: 260,
  },
  row: {
    marginBottom: 0,
    paddingVertical: spacing.xs,
  },
  yearLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: 4,
  },
  yearLabel: {
    fontWeight: "700",
  },
  rowInputs: {
    flexDirection: "row",
    columnGap: spacing.sm,
  },
  rowInput: {
    flex: 1,
  },
});

