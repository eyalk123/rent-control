import React from "react";
import { StyleSheet, View } from "react-native";
import type { Control, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { spacing } from "@/src/core/theme";
import { FormSectionCard } from "@/src/shared/components/form/FormSectionCard";
import type { TFunction } from "i18next";
import {
  FormTextField,
  FormNumericField,
} from "@/src/shared/components/form/FormFields";
import { PropertyPicker } from "@/src/features/properties/components/PropertyPicker";

type RenterBasicInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
};

function RenterBasicInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
}: RenterBasicInfoCardProps<TFieldValues>) {
  return (
    <FormSectionCard title={t("renter.basicInfo")}>
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
    </FormSectionCard>
  );
}

export const RenterBasicInfoCard = React.memo(
  RenterBasicInfoCardInner,
) as typeof RenterBasicInfoCardInner;

const styles = StyleSheet.create({
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
