import React from "react";
import type { Control, FieldValues } from "react-hook-form";
import { FormDropdown } from "@/src/components/form/FormDropdown";
import { ImagePickerSection } from "@/src/screens/components/ImagePickerSection";
import { FormSectionCard } from "@/src/components/form/FormSectionCard";
import { FormTextField, FormNumericField } from "@/src/components/form/FormFields";
import type { PropertyType } from "@/src/types";
import type { TFunction } from "i18next";

type BasicInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
};

function BasicInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  imageUri,
  setImageUri,
}: BasicInfoCardProps<TFieldValues>) {
  const translateTypeLabel = (type: PropertyType) =>
    t(`property.type${type.charAt(0).toUpperCase() + type.slice(1)}`);

  const textFields = [
    { name: "address", labelKey: "property.address", required: true },
    { name: "city", labelKey: "property.city", required: true },
  ] as const;

  const numericFields = [
    {
      name: "zipCode",
      labelKey: "property.zipCode",
      keyboardType: "numeric" as const,
    },
    {
      name: "sqFt",
      labelKey: "property.sqFt",
      keyboardType: "numeric" as const,
    },
    {
      name: "purchasePrice",
      labelKey: "property.purchasePrice",
      keyboardType: "decimal-pad" as const,
    },
  ];

  return (
    <FormSectionCard title={t("property.basicInfo")}>
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
        name={"zipCode" as any}
        label={`${t("property.zipCode")} *`}
        keyboardType="numeric"
      />
      <FormDropdown
        control={control}
        name={"type" as any}
        label={`${t("property.type")} *`}
        translateTypeLabel={translateTypeLabel}
        placeholderKey={t("property.typePlaceholder")}
      />
      {numericFields
        .filter((f) => f.name !== "zipCode")
        .map((f) => (
          <FormNumericField
            key={f.name}
            control={control}
            name={f.name as any}
            label={`${t(f.labelKey)} *`}
            keyboardType={f.keyboardType}
          />
        ))}
      <ImagePickerSection
        imageUri={imageUri}
        setImageUri={setImageUri}
        t={t}
      />
    </FormSectionCard>
  );
}

export const BasicInfoCard = React.memo(BasicInfoCardInner) as typeof BasicInfoCardInner;