import { FormInput } from "@/src/components/form/FormInput";
import { FormChipInput } from "@/src/components/form/FormChipInput";
import { useRtlPlaceholder } from "@/src/context";
import { spacing } from "@/src/theme";
import { FormSectionCard } from "@/src/components/form/FormSectionCard";
import { FormNumericField } from "@/src/components/form/FormFields";
import type { TFunction } from "i18next";
import React from "react";
import type { Control, FieldValues } from "react-hook-form";
import { View } from "react-native";

type LeaseInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
};

function LeaseInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
}: LeaseInfoCardProps<TFieldValues>) {
  const rtlPlaceholder = useRtlPlaceholder();

  const numericFields: { name: string; labelKey: string; decimal?: boolean }[] =
    [
      { name: "numberOfRooms", labelKey: "property.numberOfRooms" },
      { name: "waterMeterTax", labelKey: "property.waterMeterTax", decimal: true },
      { name: "propertyTax", labelKey: "property.propertyTax", decimal: true },
      { name: "houseCommittee", labelKey: "property.houseCommittee", decimal: true },
    ];

  return (
    <FormSectionCard title={t("property.leaseInfo")}>
      <View
        style={{
          marginTop: spacing.sm,
          flexDirection: "row",
          alignItems: "center",
        }}
      />
      <FormNumericField
        control={control}
        name={"numberOfRooms" as any}
        label={t("property.numberOfRooms")}
      />
      <FormChipInput
        control={control}
        name={"parkingNumbersStr" as any}
        label={t("property.parkingNumbers")}
        placeholder={rtlPlaceholder(t("property.parkingNumbersPlaceholder"))}
      />
      <FormInput
        control={control}
        name={"electricityMeterNumber" as any}
        label={t("property.electricityMeterNumber")}
      />
      {numericFields
        .filter((f) => f.name !== "numberOfRooms")
        .map((f) => (
          <FormNumericField
            key={f.name}
            control={control}
            name={f.name as any}
            label={t(f.labelKey)}
            keyboardType={f.decimal ? "decimal-pad" : "numeric"}
          />
        ))}
    </FormSectionCard>
  );
}

export const LeaseInfoCard = React.memo(LeaseInfoCardInner) as typeof LeaseInfoCardInner;