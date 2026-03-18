import React from "react";
import type { Control, FieldValues } from "react-hook-form";
import {
  FormSectionCard,
  FormTextField,
  FormNumericField,
  FormDropdownOptions,
} from "@/src/shared/components/form";
import { useRtlPlaceholder } from "@/src/core/context";
import { PropertyHouseImageField } from "@/src/features/properties/components/PropertyHouseImageField";
import { PROPERTY_TYPES } from "@/src/features/properties/validation/propertyValidation";
import type { PropertyType } from "@/src/shared/types";
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
  const rtlPlaceholder = useRtlPlaceholder();
  const translateTypeLabel = (type: PropertyType) =>
    t(`property.type${type.charAt(0).toUpperCase() + type.slice(1)}`);

  const propertyTypeOptions = React.useMemo(
    () =>
      PROPERTY_TYPES.map((ty) => ({
        label: translateTypeLabel(ty),
        value: ty,
      })),
    [translateTypeLabel, t],
  );

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
      <FormDropdownOptions
        control={control}
        name={"type" as any}
        label={`${t("property.type")} *`}
        options={propertyTypeOptions}
        placeholder={rtlPlaceholder(t("property.typePlaceholder"))}
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
      <PropertyHouseImageField
        imageUrl={imageUri}
        onChangeImageUrl={setImageUri}
        t={t}
      />
    </FormSectionCard>
  );
}

export const BasicInfoCard = React.memo(BasicInfoCardInner) as typeof BasicInfoCardInner;
