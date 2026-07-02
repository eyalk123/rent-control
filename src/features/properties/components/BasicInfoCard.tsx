import React from "react";
import type { Control, FieldValues } from "react-hook-form";
import { HelperText } from "react-native-paper";
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
  /** Debug hint: the verbatim clause a scan based the property address on (scan flow only). */
  addressEvidence?: string | null;
};

function BasicInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  imageUri,
  setImageUri,
  ownerId,
  addressEvidence,
}: BasicInfoCardProps<TFieldValues>) {
  const rtlPlaceholder = useRtlPlaceholder();
  const { properties } = usePropertyContext();
  const translateTypeLabel = (type: PropertyType) => {
    const key = type.split('_').map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1)).join('');
    return t(`property.type${key}`);
  };

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

  const addressFields = [
    { name: "address", labelKey: "property.address", required: true as const },
  ] as const;

  const cityField = { name: "city", labelKey: "property.city", required: true as const };

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
      {addressFields.map((f) => (
        <FormTextField
          key={f.name}
          control={control}
          name={f.name as any}
          label={t(f.labelKey)}
          required={f.required}
        />
      ))}
      {addressEvidence ? (
        <HelperText type="info" visible>
          {t("documentScan.addressEvidence", { snippet: addressEvidence })}
        </HelperText>
      ) : null}
      <FormNumericField
        control={control}
        name={"floor" as any}
        label={t("property.floor")}
        keyboardType="numeric"
      />
      <FormTextField
        control={control}
        name={"apartment" as any}
        label={t("property.apartment")}
      />
      <FormTextField
        control={control}
        name={cityField.name as any}
        label={t(cityField.labelKey)}
        required={cityField.required}
      />
      <FormNumericField
        control={control}
        name={"block" as any}
        label={t("property.block")}
        keyboardType="numeric"
      />
      <FormNumericField
        control={control}
        name={"plot" as any}
        label={t("property.plot")}
        keyboardType="numeric"
      />
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
        required
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
