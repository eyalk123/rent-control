import React from "react";
import { StyleSheet, View } from "react-native";
import type { Control, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { PropertyPicker } from "@/src/features/properties/components/PropertyPicker";
import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlPlaceholder,
} from "@/src/core/context";
import { spacing } from "@/src/core/theme";
import type { TFunction } from "i18next";
import { FormSectionCard } from "@/src/shared/components/form/FormSectionCard";
import { FormDateField, FormNumericField, FormTextField } from "@/src/shared/components/form/FormFields";

type RenterLeaseInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
};

function RenterLeaseInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
}: RenterLeaseInfoCardProps<TFieldValues>) {
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();
  const { isRtl } = useLanguageContext();

  const simpleNumericFields: { name: string; labelKey: string; decimal?: boolean }[] = [
    { name: "numberOfPayments", labelKey: "renter.numberOfPayments" },
    { name: "paymentDayOfMonth", labelKey: "renter.dateOfPayment" },
    { name: "insuranceAmount", labelKey: "renter.insuranceAmount", decimal: true },
  ];

  return (
    <FormSectionCard title={t("renter.leaseInfo")}>
      <Controller
        control={control}
        name={"propertyId" as any}
        render={({ field: { onChange, value } }) => (
          <PropertyPicker
            value={value}
            onChange={onChange}
            label={t("renter.propertyOptional")}
          />
        )}
      />

      <View style={styles.inputWrap}>
        <FormDateField
          control={control}
          name={"leaseStart" as any}
          label={`${t("renter.leaseStart")} *`}
          placeholder={t("renter.leaseStartPlaceholder")}
        />
      </View>

      <View style={styles.inputWrap}>
        <FormDateField
          control={control}
          name={"leaseEnd" as any}
          label={`${t("renter.leaseEnd")} *`}
          placeholder={t("renter.leaseEndPlaceholder")}
        />
      </View>

      {simpleNumericFields.map((f) => (
        <View key={f.name} style={styles.inputWrap}>
          <FormNumericField
            control={control}
            name={f.name as any}
            label={t(f.labelKey)}
            keyboardType={f.decimal ? "decimal-pad" : "numeric"}
          />
        </View>
      ))}

      <View style={styles.inputWrap}>
        <FormTextField
          control={control}
          name={"paymentType" as any}
          label={t("renter.paymentType")}
          placeholder={rtlPlaceholder(t("renter.paymentTypePlaceholder"))}
        />
      </View>

      <View style={styles.inputWrap}>
        <FormTextField
          control={control}
          name={"insuranceType" as any}
          label={t("renter.insuranceType")}
        />
      </View>

    </FormSectionCard>
  );
}

export const RenterLeaseInfoCard = React.memo(
  RenterLeaseInfoCardInner,
) as typeof RenterLeaseInfoCardInner;

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
  helperText: {
    marginTop: 2,
    marginBottom: spacing.xs,
  },
});
