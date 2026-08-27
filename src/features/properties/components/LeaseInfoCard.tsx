import { FormInput } from "@/src/shared/components/form/FormInput";
import { FormChipInput } from "@/src/shared/components/form/FormChipInput";
import { FormSingleFileField } from "@/src/shared/components/form/FormSingleFileField";
import { useRtlPlaceholder } from "@/src/core/context";
import { TourAnchor } from "@/src/features/onboarding/AnchorRegistry";
import { ANCHORS } from "@/src/features/onboarding/anchors";
import { spacing } from "@/src/core/theme";
import { FormSectionCard } from "@/src/shared/components/form/FormSectionCard";
import { FormNumericField } from "@/src/shared/components/form/FormFields";
import { CustomFilesSection } from "@/src/features/properties/components/CustomFilesSection";
import type { TFunction } from "i18next";
import React from "react";
import type { Control, FieldValues } from "react-hook-form";
import { View } from "react-native";
import type { PropertyFile } from "@/src/shared/types";

type LeaseInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  ownerId: string;
  existingFiles: PropertyFile[];
  deletedFileIds: number[];
  onDeleteExistingToggle: (id: number) => void;
};

function LeaseInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  ownerId,
  existingFiles,
  deletedFileIds,
  onDeleteExistingToggle,
}: LeaseInfoCardProps<TFieldValues>) {
  const rtlPlaceholder = useRtlPlaceholder();

  const numericFields: { name: string; labelKey: string; decimal?: boolean }[] =
    [
      { name: "numberOfRooms", labelKey: "property.numberOfRooms" },
      { name: "propertyTax", labelKey: "property.propertyTax", decimal: true },
      { name: "houseCommittee", labelKey: "property.houseCommittee", decimal: true },
    ];

  return (
    // The whole card under one anchor: the tour has a single thing to say about everything on
    // this page, and pointing at each field in turn would be a card per field.
    <TourAnchor id={ANCHORS.propertyFormRecords}>
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
        keyboardType="decimal-pad"
      />
      <FormInput
        control={control}
        name={"inventoryNotes" as any}
        label={t("property.inventoryNotes")}
        placeholder={rtlPlaceholder(t("property.inventoryNotesPlaceholder"))}
        multiline
      />
      <FormChipInput
        control={control}
        name={"parkingNumbersStr" as any}
        label={t("property.parkingNumbers")}
        placeholder={rtlPlaceholder(t("property.parkingNumbersPlaceholder"))}
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
      <FormInput
        control={control}
        name={"electricityMeterNumber" as any}
        label={t("property.electricityMeterNumber")}
      />
      <FormInput
        control={control}
        name={"electricityAccountNumber" as any}
        label={t("property.electricityAccountNumber")}
      />
      <FormInput
        control={control}
        name={"waterMeterNumber" as any}
        label={t("property.waterMeterNumber")}
      />
      <FormInput
        control={control}
        name={"waterAccountNumber" as any}
        label={t("property.waterAccountNumber")}
      />
      <FormSingleFileField
        control={control}
        name={"basicContractUrl" as any}
        label={t("documents.basicContract")}
        t={t}
        entityType="properties"
        ownerId={ownerId}
        accept="document"
      />
      <FormSingleFileField
        control={control}
        name={"landRegistryUrl" as any}
        label={t("documents.landRegistry")}
        t={t}
        entityType="properties"
        ownerId={ownerId}
        accept="document"
      />
      <CustomFilesSection
        control={control}
        t={t}
        existingFiles={existingFiles}
        deletedFileIds={deletedFileIds}
        onDeleteExistingToggle={onDeleteExistingToggle}
      />
    </FormSectionCard>
    </TourAnchor>
  );
}

export const LeaseInfoCard = React.memo(LeaseInfoCardInner) as typeof LeaseInfoCardInner;
