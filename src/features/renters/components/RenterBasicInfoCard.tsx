import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import type { Control, FieldValues } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { spacing, lightColors, darkColors, useEntityColor } from "@/src/core/theme";
import { FormSectionCard } from "@/src/shared/components/form/FormSectionCard";
import { FormExtraContactsField, FormRow, FormSingleFileField } from "@/src/shared/components/form";
import type { TFunction } from "i18next";
import {
  FormTextField,
  FormNumericField,
} from "@/src/shared/components/form/FormFields";
import { PropertyPicker } from "@/src/features/properties/components/PropertyPicker";
import { ColorPicker, Icon } from "@/src/shared/components/ui";
import { RenterAvatar } from "@/src/features/renters/components/RenterAvatar";
import type { Renter } from "@/src/shared/types";
import { ANCHORS } from "@/src/features/onboarding/anchors";
import { TourAnchor } from "@/src/features/onboarding/AnchorRegistry";
import { Text, useTheme } from "react-native-paper";

type RenterBasicInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  ownerId: string;
  isEdit?: boolean;
  onPickFromContacts?: () => void;
  onPickExtraContact?: () => Promise<{ name: string; phone: string } | null>;
  /** Shown, and saved, while the renter has no color of their own yet. */
  suggestedColor?: string | null;
};

function RenterBasicInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  ownerId,
  isEdit = false,
  onPickFromContacts,
  onPickExtraContact,
  suggestedColor = null,
}: RenterBasicInfoCardProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  // `as never` on the names: this card is generic over the form's field types.
  const [firstName, lastName, contactId, pickedColor] = useWatch({
    control,
    name: ["firstName", "lastName", "contactId", "color"] as never,
  }) as unknown as [string | undefined, string | undefined, string | null | undefined, string | null | undefined];
  const shownColor = pickedColor ?? suggestedColor;
  const itemColor = useEntityColor(shownColor);
  // Enough of a renter for the avatar: initials as they are typed, or the contact's photo.
  const avatarRenter = { first_name: firstName ?? "", last_name: lastName ?? "", contact_id: contactId ?? null } as Renter;

  return (
    <FormSectionCard title={t("renter.basicInfo")}>
      {/* The avatar previews the renter as the lists will show them: initials on their color.
          Not tappable - the color is changed with the swatches under the name. */}
      <View style={styles.avatarRow}>
        {firstName || lastName || contactId ? (
          <RenterAvatar
            renter={avatarRenter}
            size={52}
            radius={15}
            backgroundColor={itemColor.bg}
            textColor={itemColor.fg}
          />
        ) : (
          // Before a name is typed: a person on the color rather than the avatar's "?".
          <View style={[styles.avatarEmpty, { backgroundColor: itemColor.bg }]}>
            <Icon name="user" size={24} color={itemColor.fg} />
          </View>
        )}
        {!isEdit && onPickFromContacts && Platform.OS !== "web" && (
          <TouchableOpacity
            style={[styles.contactButton, { backgroundColor: colors.primaryBg }]}
            onPress={onPickFromContacts}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Icon
              name="users"
              size={18}
              color={colors.primary}
            />
            <Text variant="bodyMedium" style={[styles.contactLabel, { color: colors.primary }]} numberOfLines={1}>
              {t("renter.chooseFromContacts")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <FormRow>
        <FormTextField
          control={control}
          name={"firstName" as any}
          label={t("renter.firstName")}
          required
        />
        <FormTextField
          control={control}
          name={"lastName" as any}
          label={t("renter.lastName")}
          required
        />
      </FormRow>
      <Controller
        control={control}
        name={"color" as any}
        render={({ field: { onChange } }) => (
          <View style={styles.colorRow}>
            <Text style={[styles.colorLabel, { color: colors.fieldLabel }]}>
              {t("entityColors.label")}
            </Text>
            <ColorPicker value={shownColor} onChange={onChange} />
          </View>
        )}
      />
      <FormNumericField
        control={control}
        name={"phone" as any}
        label={t("renter.phone")}
        keyboardType="phone-pad"
        required
      />
      <FormTextField
        control={control}
        name={"email" as any}
        label={t("renter.email")}
        keyboardType="email-address"
      />
      <View style={styles.inputWrap}>
        <Controller
          control={control}
          name={"propertyId" as any}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <PropertyPicker
              value={value}
              onChange={onChange}
              label={t("renter.propertyOptional")}
              error={error}
            />
          )}
        />
      </View>
      <FormSingleFileField
        control={control}
        name={"idImageUrl" as any}
        label={t("documents.idImage")}
        t={t}
        entityType="renters"
        ownerId={ownerId}
        accept="image"
      />
      <TourAnchor id={ANCHORS.renterFormExtraContacts}>
        <FormExtraContactsField
          control={control}
          name={"extraContacts" as any}
          t={t}
          onPickContact={onPickExtraContact ?? (() => Promise.resolve(null))}
        />
      </TourAnchor>
    </FormSectionCard>
  );
}

export const RenterBasicInfoCard = React.memo(
  RenterBasicInfoCardInner,
) as typeof RenterBasicInfoCardInner;

const styles = StyleSheet.create({
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatarEmpty: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  contactButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  contactLabel: {
    flexShrink: 1,
    fontWeight: "500",
  },
  colorRow: {
    marginBottom: spacing.md,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
    textAlign: "left",
  },
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
