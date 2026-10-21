import React from "react";
import { registryKey1, registryKey2 } from "@/src/shared/utils/registryLabels";
import { areaUnitLabel } from "@/src/shared/utils/money";
import { Controller, type Control, type FieldValues } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { HelperText, Text, useTheme } from "react-native-paper";
import {
  FormField,
  FormSectionCard,
  FormRow,
  FormSubheading,
  FormTextField,
  FormNumericField,
} from "@/src/shared/components/form";
import { Icon } from "@/src/shared/components/ui";
import {
  darkColors,
  lightColors,
  spacing,
  useEntityColor,
  type EntityColorKey,
} from "@/src/core/theme";
import { useRtlPlaceholder } from "@/src/core/context";
import { PropertyHouseImageField } from "@/src/features/properties/components/PropertyHouseImageField";
import { availablePropertyTypes } from "@/src/features/properties/validation/propertyValidation";
import { propertyTypeLabelKey } from "@/src/features/properties/constants/propertyTypeLabel";
import type { PropertyOwner, PropertyType } from "@/src/shared/types";
import type { TFunction } from "i18next";
import { PropertyOwnerPicker } from "@/src/features/property-owners/components/PropertyOwnerPicker";
import { ANCHORS } from "@/src/features/onboarding/anchors";
import { TourAnchor } from "@/src/features/onboarding/AnchorRegistry";
import { useTour } from "@/src/features/onboarding/TourController";

type BasicInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  imageUri: string | null;
  setImageUri: (uri: string | null) => void;
  color: string | null | undefined;
  setColor: (color: EntityColorKey) => void;
  ownerId: string;
  /** Debug hint: the verbatim clause a scan based the property address on (scan flow only). */
  addressEvidence?: string | null;
  owners: PropertyOwner[];
  ownersLoaded: boolean;
  onReloadOwners: () => void;
  onAddOwner: (initialName: string | null) => void;
};

function BasicInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  imageUri,
  setImageUri,
  color,
  setColor,
  ownerId,
  addressEvidence,
  owners,
  ownersLoaded,
  onReloadOwners,
  onAddOwner,
}: BasicInfoCardProps<TFieldValues>) {
  // Asked from here, not from AddEditPropertyScreen: the owner field is one of the tour's
  // anchors and it only exists while step 1 is mounted. Asking from the screen would ask
  // again on step 2, where the anchor is gone.
  useTour('property-form');
  const rtlPlaceholder = useRtlPlaceholder();

  // Order follows how someone describes a property out loud - street, then town, then which
  // unit - rather than the column order of the table behind it. It used to run address,
  // floor, apartment, city, block, plot, owner, zip, type, size, with City fourth and Zip
  // four fields away from it.
  return (
    <FormSectionCard
      title={t("property.basicInfo")}
      subtitle={t("property.basicInfoSubtitle")}
    >
      <PropertyHouseImageField
        imageUrl={imageUri}
        onChangeImageUrl={setImageUri}
        color={color}
        onChangeColor={setColor}
        t={t}
        ownerId={ownerId}
      />
      <FormTextField
        control={control}
        name={"address" as any}
        label={t("property.address")}
        required
      />
      {addressEvidence ? (
        <HelperText type="info" visible>
          {t("documentScan.addressEvidence", { snippet: addressEvidence })}
        </HelperText>
      ) : null}
      <FormRow>
        <FormTextField
          control={control}
          name={"city" as any}
          label={t("property.city")}
          required
        />
        <FormNumericField
          control={control}
          name={"zipCode" as any}
          label={t("property.zipCode")}
          keyboardType="numeric"
        />
      </FormRow>
      <FormRow>
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
      </FormRow>

      {/* Whose property it is comes right after where it is: the owner decides which
          reports and bank details apply, so it sits high, not at the end of the card. */}
      <TourAnchor id={ANCHORS.propertyFormOwnerField}>
        {/* The field holds the owner's name — unique per account, and what the lease
            scanner fills — and the save matches it to an owner record. */}
        <Controller
          control={control}
          name={"propertyOwner" as any}
          render={({ field: { value, onChange } }) => (
            <PropertyOwnerPicker
              owners={owners}
              ownersLoaded={ownersLoaded}
              onReload={onReloadOwners}
              value={(value as string) ?? ""}
              onChange={onChange}
              label={t("property.propertyOwner")}
              placeholder={rtlPlaceholder(t("property.ownerPlaceholder"))}
              onAddOwner={onAddOwner}
              reviewName="propertyOwner"
            />
          )}
        />
      </TourAnchor>

      <FormSubheading title={t("property.landRegistry")} />
      {/*
        Free text, not numbers. Israel's block and parcel are digits, but a UK title number
        (NGL123456) and a cadastral reference are not — and the column behind both has always
        been a string, so a numeric keypad was the only thing refusing them. That made the
        country-specific labels unusable in most of the countries they were added for.

        The second field renders only where the country has a second identifier. Falling back
        to "Plot" showed an Israeli concept to a country with one — which the property detail
        screen already knew not to do.
      */}
      <FormRow>
        <FormTextField
          control={control}
          name={"block" as any}
          label={t(registryKey1())}
        />
        {registryKey2() ? (
          <FormTextField
            control={control}
            name={"plot" as any}
            label={t(registryKey2()!)}
          />
        ) : null}
      </FormRow>

      <FormSubheading title={t("property.details")} />
      <Controller
        control={control}
        name={"type" as any}
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <PropertyTypeChips
            label={t("property.type")}
            value={value as PropertyType | ""}
            onChange={onChange}
            color={color}
            error={error}
            t={t}
          />
        )}
      />
      {/* Size and rooms both describe the unit itself. Rooms used to sit on page two beside
          Parking, whose chips stack under a half-width box and pushed the form down. */}
      <FormRow>
        <FormNumericField
          control={control}
          name={"sqFt" as any}
          label={`${t("property.sqFt")} (${areaUnitLabel()})`}
          keyboardType="numeric"
        />
        <FormNumericField
          control={control}
          name={"numberOfRooms" as any}
          label={t("property.numberOfRooms")}
          keyboardType="decimal-pad"
        />
      </FormRow>
    </FormSectionCard>
  );
}

/**
 * The property types as chips rather than a dropdown: there are at most eight, all short, so
 * showing them saves a tap and shows the choice at a glance. The picked chip wears the
 * property's color, the first place the new color shows up.
 *
 * `availablePropertyTypes()` keeps the per-country list. A stored type that list no longer
 * offers (an Israeli type on an account that moved country) still shows, picked, so it is
 * never silently dropped.
 */
function PropertyTypeChips({
  label,
  value,
  onChange,
  color,
  error,
  t,
}: {
  label: string;
  value: PropertyType | "";
  onChange: (type: PropertyType) => void;
  color: string | null | undefined;
  error?: { message?: string };
  t: TFunction;
}) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const itemColor = useEntityColor(color);
  const types = availablePropertyTypes();
  const shown = value && !types.includes(value) ? [...types, value] : types;

  return (
    <FormField label={label} required error={error} reviewName="type">
      <View style={chipStyles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {shown.map((ty) => {
          const selected = ty === value;
          return (
            <Pressable
              key={ty}
              onPress={() => onChange(ty)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={chipStyles.hit}
            >
              <View
                style={[
                  chipStyles.chip,
                  selected
                    ? { backgroundColor: itemColor.bg, borderColor: itemColor.fg, borderWidth: 1.5 }
                    : { backgroundColor: colors.surface, borderColor: colors.inputBorder },
                ]}
              >
                {selected ? <Icon name="check" size={16} color={itemColor.fg} strokeWidth={2.5} /> : null}
                <Text
                  style={[
                    chipStyles.label,
                    { color: selected ? itemColor.fg : colors.textPrimary },
                    selected && chipStyles.labelSelected,
                  ]}
                >
                  {t(propertyTypeLabelKey(ty))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </FormField>
  );
}

const chipStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing.sm,
  },
  // A 36pt chip inside a 44pt touch target (MOBILE-DESIGN.md: 44 is a hard floor).
  hit: {
    minHeight: 44,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
  },
  labelSelected: {
    fontWeight: "600",
  },
});

export const BasicInfoCard = React.memo(BasicInfoCardInner) as typeof BasicInfoCardInner;
