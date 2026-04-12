import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import type { Control, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { spacing } from "@/src/core/theme";
import { FormSectionCard } from "@/src/shared/components/form/FormSectionCard";
import { FormExtraContactsField } from "@/src/shared/components/form";
import type { TFunction } from "i18next";
import {
  FormTextField,
  FormNumericField,
} from "@/src/shared/components/form/FormFields";
import { PropertyPicker } from "@/src/features/properties/components/PropertyPicker";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "react-native-paper";
import { Text } from "react-native-paper";
import { lightColors, darkColors } from "@/src/core/theme";

type RenterBasicInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  isEdit?: boolean;
  onPickFromContacts?: () => void;
  onPickExtraContact?: () => Promise<{ name: string; phone: string } | null>;
};

function RenterBasicInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  isEdit = false,
  onPickFromContacts,
  onPickExtraContact,
}: RenterBasicInfoCardProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <FormSectionCard title={t("renter.basicInfo")}>
      {!isEdit && onPickFromContacts && Platform.OS !== "web" && (
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: colors.inputBackground }]}
          onPress={onPickFromContacts}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="account-multiple"
            size={22}
            color={colors.primary}
            style={styles.contactIcon}
          />
          <Text variant="bodyMedium" style={{ color: colors.primary }}>
            {t("renter.chooseFromContacts")}
          </Text>
        </TouchableOpacity>
      )}
      <FormTextField
        control={control}
        name={"firstName" as any}
        label={`${t("renter.firstName")} *`}
      />
      <FormTextField
        control={control}
        name={"lastName" as any}
        label={`${t("renter.lastName")} *`}
      />
      <FormNumericField
        control={control}
        name={"phone" as any}
        label={`${t("renter.phone")} *`}
        keyboardType="phone-pad"
      />
      <FormTextField
        control={control}
        name={"email" as any}
        label={`${t("renter.email")} *`}
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
      <FormExtraContactsField
        control={control}
        name={"extraContacts" as any}
        t={t}
        onPickContact={onPickExtraContact ?? (() => Promise.resolve(null))}
      />
    </FormSectionCard>
  );
}

export const RenterBasicInfoCard = React.memo(
  RenterBasicInfoCardInner,
) as typeof RenterBasicInfoCardInner;

const styles = StyleSheet.create({
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.sm,
  },
  contactIcon: {
    marginEnd: spacing.sm,
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
