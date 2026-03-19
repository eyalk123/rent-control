import React from "react";
import { Alert } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TFunction } from "i18next";
import { getApiErrorMessage } from "@/src/core/api/client";
import {
  createRenter,
  getRenterById,
  updateRenter,
} from "@/src/features/renters/api/renters";
import type {
  LeaseYear,
  RenterCreate,
  RenterUpdate,
} from "@/src/shared/types";
import {
  renterFormSchema,
  type RenterFormValues,
} from "@/src/features/renters/validation/renterValidation";

type UseRenterFormParams = {
  id?: string;
  t: TFunction;
  refreshRenters: () => Promise<void>;
  onSuccess: () => void;
};

export function useRenterForm({
  id,
  t,
  refreshRenters,
  onSuccess,
}: UseRenterFormParams) {
  const isEdit = Boolean(id);
  const [isFetching, setIsFetching] = React.useState<boolean>(isEdit);

  const formMethods = useForm<RenterFormValues>({
    resolver: zodResolver(renterFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      leaseStart: "",
      propertyId: null,
      paymentType: "",
      paymentDate: "",
      paymentFrequency: undefined,
      insuranceType: "",
      insuranceAmount: "",
      contractYears: "",
      leaseYears: [],
      contactId: null,
    },
    mode: "onBlur",
  });

  const { reset, handleSubmit, formState } = formMethods;

  React.useEffect(() => {
    if (!isEdit || !id) {
      setIsFetching(false);
      return;
    }
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    getRenterById(numericId)
      .then((renter) => {
        const lease_years = renter.lease_years ?? [];
        reset({
          firstName: renter.first_name ?? "",
          lastName: renter.last_name ?? "",
          phone: renter.phone ?? "",
          email: renter.email ?? "",
          leaseStart: renter.lease_start ?? "",
          propertyId: renter.property_id ?? null,
          paymentType: renter.payment_type ?? "",
          paymentDate:
            renter.payment_day_of_month != null
              ? `2000-01-${String(renter.payment_day_of_month).padStart(2, "0")}`
              : "",
          paymentFrequency:
            renter.number_of_payments === 12
              ? "monthly"
              : renter.number_of_payments === 4
              ? "quarterly"
              : renter.number_of_payments === 1
              ? "yearly"
              : undefined,
          insuranceType: renter.insurance_type ?? "",
          insuranceAmount:
            renter.insurance_amount != null
              ? String(renter.insurance_amount)
              : "",
          contractYears:
            lease_years.length > 0 ? String(lease_years.length) : "",
          leaseYears: lease_years.map((y) => ({
            amount: String(y.amount),
            type: y.type,
          })),
          contactId: renter.contact_id ?? null,
        });
      })
      .finally(() => setIsFetching(false));
  }, [id, isEdit, reset]);

  const submit = handleSubmit(async (values) => {
    const leaseStartTrimmed = values.leaseStart.trim();
    const paymentDayNum =
      values.paymentDate && values.paymentDate.length >= 10
        ? Number(values.paymentDate.slice(8, 10))
        : null;
    const numPayments =
      values.paymentFrequency === "monthly"
        ? 12
        : values.paymentFrequency === "quarterly"
        ? 4
        : values.paymentFrequency === "yearly"
        ? 1
        : null;
    const insuranceAmt = values.insuranceAmount
      ? Number(values.insuranceAmount)
      : null;
    const leaseYearsForm = values.leaseYears ?? [];
    const lease_years: LeaseYear[] = leaseYearsForm
      .map((row) => {
        const amount = row?.amount ? Number(row.amount) : NaN;
        const type = row?.type === "option" || row?.type === "contract"
          ? row.type
          : "contract";
        if (!Number.isFinite(amount) || amount < 0) return null;
        return { amount, type };
      })
      .filter((y): y is LeaseYear => y != null);

    const baseCreate: RenterCreate = {
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      lease_start: leaseStartTrimmed,
      property_id: values.propertyId ?? undefined,
      lease_years,
      contact_id: values.contactId ?? undefined,
    };
    if (numPayments != null && !Number.isNaN(numPayments)) {
      baseCreate.number_of_payments = numPayments;
    }
    if (values.paymentType.trim()) {
      baseCreate.payment_type = values.paymentType.trim();
    }
    if (paymentDayNum != null && !Number.isNaN(paymentDayNum)) {
      baseCreate.payment_day_of_month = paymentDayNum;
    }
    if (values.insuranceType.trim()) {
      baseCreate.insurance_type = values.insuranceType.trim();
    }
    if (insuranceAmt != null && !Number.isNaN(insuranceAmt)) {
      baseCreate.insurance_amount = insuranceAmt;
    }

    const baseUpdate: RenterUpdate = {
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      lease_start: leaseStartTrimmed,
      property_id: values.propertyId ?? null,
      lease_years,
    };
    if (numPayments != null && !Number.isNaN(numPayments)) {
      baseUpdate.number_of_payments = numPayments;
    }
    if (values.paymentType.trim()) {
      baseUpdate.payment_type = values.paymentType.trim();
    }
    if (paymentDayNum != null && !Number.isNaN(paymentDayNum)) {
      baseUpdate.payment_day_of_month = paymentDayNum;
    }
    if (values.insuranceType.trim()) {
      baseUpdate.insurance_type = values.insuranceType.trim();
    }
    if (insuranceAmt != null && !Number.isNaN(insuranceAmt)) {
      baseUpdate.insurance_amount = insuranceAmt;
    }

    try {
      if (isEdit && id) {
        const numericId = Number(id);
        await updateRenter(numericId, baseUpdate);
      } else {
        await createRenter(baseCreate);
      }

      await refreshRenters();
      reset(values);
      onSuccess();
    } catch (err) {
      Alert.alert(
        t("error.title"),
        getApiErrorMessage(err, t("error.saveRenterFailed")),
      );
    }
  });

  return {
    formMethods,
    onSubmit: submit,
    isSubmitting: formState.isSubmitting,
    isFetching,
  };
}
