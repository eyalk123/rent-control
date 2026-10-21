import { FormInput } from "@/src/shared/components/form/FormInput";
import { FormChipInput } from "@/src/shared/components/form/FormChipInput";
import { FormSingleFileField } from "@/src/shared/components/form/FormSingleFileField";
import { useRtlPlaceholder } from "@/src/core/context";
import { TourAnchor } from "@/src/features/onboarding/AnchorRegistry";
import { ANCHORS } from "@/src/features/onboarding/anchors";
import { darkColors, lightColors, spacing, ICON_SM } from "@/src/core/theme";
import { FormSectionCard } from "@/src/shared/components/form/FormSectionCard";
import { FormNumericField } from "@/src/shared/components/form/FormFields";
import { FormRow } from "@/src/shared/components/form/FormRow";
import { FormSubheading } from "@/src/shared/components/form/FormSubheading";
import { Icon } from "@/src/shared/components/ui";
import { CustomFilesSection } from "@/src/features/properties/components/CustomFilesSection";
import type { TFunction } from "i18next";
import React from "react";
import { useWatch, type Control, type FieldValues } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
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
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  // `as never` on the names: this card is generic over the form's field types.
  const meterValues = useWatch({
    control,
    name: [
      "electricityMeterNumber",
      "electricityAccountNumber",
      "waterMeterNumber",
      "waterAccountNumber",
    ] as never,
  }) as unknown as (string | undefined)[];
  // Four long numbers most people fill once, if ever: folded, unless the property already has
  // one (an edit, or a scanned lease that read one), so a stored number is never out of sight.
  const [metersOpen, setMetersOpen] = React.useState(() =>
    meterValues.some((v) => (v ?? "").trim() !== ""),
  );

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
      {/* The two recurring charges, side by side. */}
      <FormRow>
        <FormNumericField
          control={control}
          name={"propertyTax" as any}
          label={t("property.propertyTax")}
          keyboardType="decimal-pad"
        />
        <FormNumericField
          control={control}
          name={"houseCommittee" as any}
          label={t("property.houseCommittee")}
          keyboardType="decimal-pad"
        />
      </FormRow>
      {/* Full width: its chips flow sideways under the box instead of stacking. */}
      <FormChipInput
        control={control}
        name={"parkingNumbersStr" as any}
        label={t("property.parkingNumbers")}
        placeholder={rtlPlaceholder(t("property.parkingNumbersPlaceholder"))}
      />
      <FormInput
        control={control}
        name={"inventoryNotes" as any}
        label={t("property.inventoryNotes")}
        placeholder={rtlPlaceholder(t("property.inventoryNotesPlaceholder"))}
        multiline
      />
      <Pressable
        onPress={() => setMetersOpen((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: metersOpen }}
        // A quiet tinted surface, not a field outline, so it reads as a section to open
        // rather than a box to type into (the mockup's treatment).
        style={[styles.foldRow, { backgroundColor: colors.controlFill, borderColor: colors.outline }]}
      >
        <View style={styles.foldText}>
          <Text style={[styles.foldTitle, { color: colors.textPrimary }]}>
            {t("property.metersAndAccounts")}
          </Text>
          <Text style={[styles.foldSummary, { color: colors.textSecondary }]}>
            {t("property.metersSummary")}
          </Text>
        </View>
        <Icon name={metersOpen ? "chevron-up" : "chevron-down"} size={ICON_SM} color={colors.textSecondary} />
      </Pressable>
      {metersOpen ? (
        <>
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
        </>
      ) : null}
      <FormSubheading title={t("documents.title")} />
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

const styles = StyleSheet.create({
  foldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  foldText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  foldTitle: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "left",
  },
  foldSummary: {
    fontSize: 12,
    textAlign: "left",
  },
});
