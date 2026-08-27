import React from "react";
import { StyleSheet, View } from "react-native";
import { type Control, type FieldValues, type UseFormSetValue, useWatch } from "react-hook-form";
import { useTour } from "@/src/features/onboarding/TourController";
import { TourAnchor } from "@/src/features/onboarding/AnchorRegistry";
import { ANCHORS } from "@/src/features/onboarding/anchors";
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
  // The lease tours are requested from here rather than from the screen because this card
  // is what mounts on step two of the form, and it owns every anchor they point at. Asking
  // from the screen would ask while the user is still on step one, find nothing mounted,
  // and defer a tour that was moments from being showable.
  //
  // LeaseTermBuilder would have been the other candidate, but the lease-extension screen
  // renders it too and has a tour of its own.
  // `as never` on the name plus a cast on the way out: this card is generic over the
  // form's field types, so RHF cannot know the shape of this particular field.
  const escalationMode = useWatch({ control, name: "escalationMode" as never }) as unknown as
    | string
    | undefined;

  // `lease-form` is asked for by the screen, not here: it covers the whole renter form now
  // and has to open on page one, before this card exists. The two elaborations below stay,
  // because they can only be reached from a control this card owns.
  //
  // Both are gated on the mode, so exactly one of them can ever open, and only once the user
  // has actually chosen it. Selecting a mode changes `rentMode`, which re-runs the request —
  // that is the whole trigger.
  useTour("cpi-mode", { rentMode: escalationMode ?? null });
  useTour("custom-mode", { rentMode: escalationMode ?? null });

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

      {/* Day, type and frequency as one group — the tour's point is about the three
          together, and the day in particular is what "overdue" is counted from. */}
      <TourAnchor id={ANCHORS.renterFormPayment}>
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
          sorted={false}
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
          sorted={false}
        />
      </View>
      </TourAnchor>

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
