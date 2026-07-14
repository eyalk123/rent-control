import React from "react";
import { StyleSheet, View } from "react-native";
import { type Control, type FieldValues, type UseFormSetValue } from "react-hook-form";
import type { TFunction } from "i18next";
import { spacing } from "@/src/core/theme";
import { getPaymentMethodOptions } from "@/src/shared/constants/paymentMethods";
import { FormSectionCard } from "@/src/shared/components/form/FormSectionCard";
import {
  FormNumericField,
  FormDropdownOptions,
  LeaseTermBuilder,
  FormWheelDateField,
  FormSingleFileField,
} from "@/src/shared/components/form";

type RenterLeaseInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
  ownerId: string;
  /** Passed through to LeaseTermBuilder, which keeps year one and the base rent in step. */
  setValue: UseFormSetValue<TFieldValues>;
};

function RenterLeaseInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
  ownerId,
  setValue,
}: RenterLeaseInfoCardProps<TFieldValues>) {
  return (
    <FormSectionCard title={t("renter.leaseInfo")}>
      <View style={styles.inputWrap}>
        <FormWheelDateField
          control={control}
          name={"leaseStart" as any}
          label={t("renter.leaseStart")}
          placeholder={t("renter.leaseStartPlaceholder")}
          mode="full"
        />
      </View>

      <View style={styles.inputWrap}>
        <LeaseTermBuilder control={control} t={t} setValue={setValue} />
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
          options={getPaymentMethodOptions(t)}
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
