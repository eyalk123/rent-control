import React from "react";
import {
  useFieldArray,
  useWatch,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import type { TFunction } from "i18next";
import { spacing } from "@/src/core/theme";
import { FormNumericField } from "./FormFields";
import { FormDropdownOptions } from "./FormDropdownOptions";

type LeaseYearRow = {
  amount: string;
  type: "option" | "contract" | "";
};

type FormLeaseYearsFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  yearsCountName: Path<TFieldValues>;
  t: TFunction;
};

function FormLeaseYearsFieldInner<TFieldValues extends FieldValues>({
  control,
  name,
  yearsCountName,
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

      {fields.map((field, index) => (
        <View key={field.id} style={styles.row}>
          <Text
            variant="bodyMedium"
            style={styles.yearLabel}
          >
            {t("renter.leaseYearLabel", { year: index + 1 })}
          </Text>
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
      ))}
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
  row: {
    marginBottom: 0,
  },
  yearLabel: {
    marginBottom: 4,
  },
  rowInputs: {
    flexDirection: "row",
    columnGap: spacing.sm,
  },
  rowInput: {
    flex: 1,
  },
});

