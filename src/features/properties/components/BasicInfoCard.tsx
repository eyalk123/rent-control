import React from "react";
import type { Control, FieldValues } from "react-hook-form";
import {
  FormSectionCard,
  FormTextField,
  FormNumericField,
  FormDropdownOptions,
  FormCreatableDropdown,
} from "@/src/shared/components/form";
import { useRtlPlaceholder } from "@/src/core/context";
import { PropertyHouseImageField } from "@/src/features/properties/components/PropertyHouseImageField";
import { PROPERTY_TYPES } from "@/src/features/properties/validation/propertyValidation";
import type { PropertyType } from "@/src/shared/types";
import type { TFunction } from "i18next";
import { usePropertyContext } from "@/src/context";

type BasicInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
  ownerId: string;
};

function BasicInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  imageUri,
  setImageUri,
  ownerId,
}: BasicInfoCardProps<TFieldValues>) {
  const rtlPlaceholder = useRtlPlaceholder();
  const { properties } = usePropertyContext();
  const translateTypeLabel = (type: PropertyType) =>
    t(`property.type${type.charAt(0).toUpperCase() + type.slice(1)}`);

  const ownerOptions = React.useMemo(
    () =>
      Array.from(
        new Set(
          properties
            .map((p) => p.property_owner?.trim())
            .filter((o): o is string => !!o),
        ),
      ).sort(),
    [properties],
  );

  const propertyTypeOptions = React.useMemo(
    () =>
      PROPERTY_TYPES.map((ty) => ({
        label: translateTypeLabel(ty),
        value: ty,
      })),
    [translateTypeLabel, t],
  );

  const textFields = [
    { name: "address", labelKey: "property.address", required: true as const },
    { name: "city", labelKey: "property.city", required: true as const },
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
  ];

  return (
    <FormSectionCard
      title={t("property.basicInfo")}
      subtitle={t("property.basicInfoSubtitle")}
    >
      {textFields.map((f) => (
        <FormTextField
          key={f.name}
          control={control}
          name={f.name as any}
          label={t(f.labelKey)}
          required={f.required}
        />
      ))}
      <FormCreatableDropdown
        control={control}
        name={"propertyOwner" as any}
        label={t("property.propertyOwner")}
        options={ownerOptions}
        placeholder={rtlPlaceholder(t("property.ownerPlaceholder"))}
        createLabel={t("property.ownerCreate")}
        createModalTitle={t("property.createOwnerTitle")}
        createModalPlaceholder={t("property.ownerNamePlaceholder")}
      />
      <FormNumericField
        control={control}
        name={"zipCode" as any}
        label={t("property.zipCode")}
        keyboardType="numeric"
      />
      <FormDropdownOptions
        control={control}
        name={"type" as any}
        label={t("property.type")}
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
            label={t(f.labelKey)}
            keyboardType={f.keyboardType}
          />
        ))}
      <PropertyHouseImageField
        imageUrl={imageUri}
        onChangeImageUrl={setImageUri}
        t={t}
        ownerId={ownerId}
      />
    </FormSectionCard>
  );
}

export const BasicInfoCard = React.memo(BasicInfoCardInner) as typeof BasicInfoCardInner;
