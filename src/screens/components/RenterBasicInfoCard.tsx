import React from "react";
import { StyleSheet, View } from "react-native";
import type { Control, FieldValues } from "react-hook-form";
import { spacing } from "@/src/theme";
import { FormSectionCard } from "@/src/components/form/FormSectionCard";
import type { TFunction } from "i18next";
import { FormTextField, FormNumericField } from "@/src/components/form/FormFields";

type RenterBasicInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
};

function RenterBasicInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
}: RenterBasicInfoCardProps<TFieldValues>) {
  const textFields = [
    { name: "firstName", labelKey: "renter.firstName", required: true },
    { name: "lastName", labelKey: "renter.lastName", required: true },
    { name: "phone", labelKey: "renter.phone", required: true },
    { name: "email", labelKey: "renter.email", required: true },
  ] as const;

  return (
    <FormSectionCard title={t("renter.basicInfo")}>
      {textFields.map((f) => (
        <FormTextField
          key={f.name}
          control={control}
          name={f.name as any}
          label={`${t(f.labelKey)}${f.required ? " *" : ""}`}
        />
      ))}
      <FormNumericField
        control={control}
        name={"monthlyRent" as any}
        label={`${t("renter.monthlyRent")} *`}
        keyboardType="decimal-pad"
      />
    </FormSectionCard>
  );
}

export const RenterBasicInfoCard = React.memo(
  RenterBasicInfoCardInner,
) as typeof RenterBasicInfoCardInner;

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: 0,
  },
  errorText: {
    marginTop: 2,
    marginBottom: spacing.xs,
  },
});

