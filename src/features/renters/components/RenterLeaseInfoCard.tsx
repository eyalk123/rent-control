import React from "react";
import { StyleSheet, View } from "react-native";
import type { Control, FieldValues } from "react-hook-form";
import type { TFunction } from "i18next";
import { spacing } from "@/src/core/theme";
import { FormSectionCard } from "@/src/shared/components/form/FormSectionCard";
import {
  FormNumericField,
  FormDatePickerField,
  FormDropdownOptions,
  FormLeaseYearsField,
} from "@/src/shared/components/form";

type RenterLeaseInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
};

function RenterLeaseInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
}: RenterLeaseInfoCardProps<TFieldValues>) {
  return (
    <FormSectionCard title={t("renter.leaseInfo")}>
      <View style={styles.inputWrap}>
        <FormDatePickerField
          control={control}
          name={"leaseStart" as any}
          label={`${t("renter.leaseStart")} *`}
          placeholder={t("renter.leaseStartPlaceholder")}
        />
      </View>

      <View style={styles.inputWrap}>
        <FormLeaseYearsField
          control={control}
          name={"leaseYears" as any}
          yearsCountName={"contractYears" as any}
          t={t}
        />
      </View>

      <View style={styles.inputWrap}>
        <FormDatePickerField
          control={control}
          name={"paymentDate" as any}
          label={t("renter.dateOfPayment")}
        />
      </View>

      <View style={styles.inputWrap}>
        <FormDropdownOptions
          control={control}
          name={"paymentType" as any}
          label={t("renter.paymentType")}
          options={[
            { value: "cash", label: t("transactions.paymentMethodCash") },
            { value: "wire_transfer", label: t("transactions.paymentMethodBankTransfer") },
            { value: "bit", label: t("transactions.paymentMethodBit") },
          ]}
        />
      </View>

      <View style={styles.inputWrap}>
        <FormDropdownOptions
          control={control}
          name={"paymentFrequency" as any}
          label={t("renter.numberOfPayments")}
          options={[
            { value: "monthly", label: t("renter.frequencyMonthly") },
            { value: "quarterly", label: t("renter.frequencyQuarterly") },
            { value: "yearly", label: t("renter.frequencyYearly") },
          ]}
        />
      </View>

      <View style={styles.inputWrap}>
        <FormNumericField
          control={control}
          name={"insuranceAmount" as any}
          label={t("renter.insuranceAmount")}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputWrap}>
        <FormDropdownOptions
          control={control}
          name={"insuranceType" as any}
          label={t("renter.insuranceType")}
          options={[
            {
              value: "wire_transfer",
              label: t("renter.insuranceTypeWireTransfer"),
            },
            {
              value: "bank_guarantee",
              label: t("renter.insuranceTypeBankGuarantee"),
            },
          ]}
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
