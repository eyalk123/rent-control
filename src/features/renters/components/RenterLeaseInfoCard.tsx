import React from "react";
import { StyleSheet, View } from "react-native";
import { useWatch, type Control, type FieldValues } from "react-hook-form";
import type { TFunction } from "i18next";
import { spacing } from "@/src/core/theme";
import { FormSectionCard } from "@/src/shared/components/form/FormSectionCard";
import {
  FormNumericField,
  FormDropdownOptions,
  FormLeaseYearsField,
  FormWheelDateField,
  FormSingleFileField,
} from "@/src/shared/components/form";

type RenterLeaseInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  ownerId: string;
};

function RenterLeaseInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  ownerId,
}: RenterLeaseInfoCardProps<TFieldValues>) {
  const leaseStart = useWatch({ control, name: "leaseStart" as any }) as string | undefined;

  return (
    <FormSectionCard title={t("renter.leaseInfo")}>
      <View style={styles.inputWrap}>
        <FormWheelDateField
          control={control}
          name={"leaseStart" as any}
          label={`${t("renter.leaseStart")} *`}
          placeholder={t("renter.leaseStartPlaceholder")}
          mode="full"
        />
      </View>

      <View style={styles.inputWrap}>
        <FormLeaseYearsField
          control={control}
          name={"leaseYears" as any}
          yearsCountName={"contractYears" as any}
          leaseStart={leaseStart}
          t={t}
        />
      </View>

      <View style={styles.inputWrap}>
        <FormWheelDateField
          control={control}
          name={"paymentDate" as any}
          label={t("renter.dateOfPayment")}
          mode="dayOfMonth"
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
            { value: "check", label: t("transactions.paymentMethodCheck") },
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

      <View style={styles.inputWrap}>
        <FormNumericField
          control={control}
          name={"insuranceAmount" as any}
          label={t("renter.insuranceAmount")}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputWrap}>
        <FormSingleFileField
          control={control}
          name={"fullContractUrl" as any}
          label={t("documents.fullContract")}
          t={t}
          entityType="renters"
          ownerId={ownerId}
          accept="document"
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
