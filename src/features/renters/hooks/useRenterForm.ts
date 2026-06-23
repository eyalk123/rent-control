import React from "react";
import { useAlert } from "@/src/core/context";
import { useAppAuth } from "@/src/core/auth/AuthContext";
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
  LeaseTermIntent,
  LeaseYear,
  RenterCreate,
  RenterUpdate,
} from "@/src/shared/types";
import { reconstructIntentFromLeaseYears } from "@/src/shared/utils/leaseSchedule";
import {
  renterFormSchema,
  type RenterFormValues,
} from "@/src/features/renters/validation/renterValidation";

type UseRenterFormParams = {
  id?: string;
  t: TFunction;
  refreshRenters: () => Promise<void>;
  onSuccess: () => void;
  initialPropertyId?: number | null;
};

export function useRenterForm({
  id,
  t,
  refreshRenters,
  onSuccess,
  initialPropertyId = null,
}: UseRenterFormParams) {
  const isEdit = Boolean(id);
  const { user } = useAppAuth();
  const { appAlert } = useAlert();
  const [isFetching, setIsFetching] = React.useState<boolean>(isEdit);

  const formMethods = useForm<RenterFormValues>({
    resolver: zodResolver(renterFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      leaseStart: "",
      propertyId: initialPropertyId,
      paymentType: "",
      paymentDate: "",
      paymentFrequency: undefined,
      insuranceType: "",
      insuranceAmount: "",
      contractTermYears: "",
      optionYears: "",
      baseRent: "",
      escalationMode: "none",
      escalationValue: "",
      leaseYears: [],
      contactId: null,
      extraContacts: [],
      fullContractUrl: null,
      idImageUrl: null,
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
        // Prefer the structured intent the backend persisted; otherwise infer it
        // from the materialized lease_years so the builder re-opens sensibly.
        const intent =
          renter.contract_term_years != null
            ? {
                contractTermYears: String(renter.contract_term_years ?? 0),
                optionYears: String(renter.option_years ?? 0),
                baseRent:
                  renter.base_rent != null
                    ? String(renter.base_rent)
                    : lease_years[0]?.amount != null
                    ? String(lease_years[0].amount)
                    : "",
                escalationMode: renter.rent_escalation_mode ?? "none",
                escalationValue:
                  renter.rent_escalation_value != null
                    ? String(renter.rent_escalation_value)
                    : "",
              }
            : (() => {
                const r = reconstructIntentFromLeaseYears(lease_years);
                return {
                  contractTermYears: r.contractTermYears
                    ? String(r.contractTermYears)
                    : "",
                  optionYears: r.optionYears ? String(r.optionYears) : "",
                  baseRent: r.baseRent ? String(r.baseRent) : "",
                  escalationMode: r.escalationMode,
                  escalationValue: "",
                };
              })();
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
          contractTermYears: intent.contractTermYears,
          optionYears: intent.optionYears,
          baseRent: intent.baseRent,
          escalationMode: intent.escalationMode,
          escalationValue: intent.escalationValue,
          leaseYears: lease_years.map((y) => ({
            amount: String(y.amount),
            type: y.type,
          })),
          contactId: renter.contact_id ?? null,
          extraContacts: (renter.extra_contacts ?? []).map((c) => ({
            name: c.name ?? "",
            phone: c.phone ?? "",
          })),
          fullContractUrl: renter.full_contract_url ?? null,
          idImageUrl: renter.id_image_url ?? null,
        });
      })
      .finally(() => setIsFetching(false));
  }, [id, isEdit, reset]);

  const submit = handleSubmit(async (values) => {
    const leaseStartTrimmed = values.leaseStart?.trim() ?? "";
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
    const extra_contacts = (values.extraContacts ?? [])
      .filter((c) => c.name.trim() || c.phone.trim())
      .map((c) => ({ name: c.name.trim(), phone: c.phone.trim() }));

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

    const toNumOrNull = (v?: string) => {
      if (!v) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const leaseIntent: LeaseTermIntent = {
      contract_term_years: toNumOrNull(values.contractTermYears),
      option_years: toNumOrNull(values.optionYears),
      base_rent: toNumOrNull(values.baseRent),
      rent_escalation_mode: values.escalationMode ?? "none",
      rent_escalation_value: toNumOrNull(values.escalationValue),
    };

    const baseCreate: RenterCreate = {
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      lease_start: leaseStartTrimmed || undefined,
      property_id: values.propertyId ?? undefined,
      lease_years,
      ...leaseIntent,
      contact_id: values.contactId ?? undefined,
      extra_contacts: extra_contacts.length > 0 ? extra_contacts : null,
      full_contract_url: values.fullContractUrl ?? null,
      id_image_url: values.idImageUrl ?? null,
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

    // Edit payload always includes optional fields (null when empty) so clearing one
    // persists; conditionally omitting a key makes sanitizeRenterUpdate drop it and the
    // backend keep the old value.
    const baseUpdate: RenterUpdate = {
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      lease_start: leaseStartTrimmed || null,
      property_id: values.propertyId ?? null,
      lease_years,
      ...leaseIntent,
      number_of_payments:
        numPayments != null && !Number.isNaN(numPayments) ? numPayments : null,
      payment_type: values.paymentType.trim() || null,
      payment_day_of_month:
        paymentDayNum != null && !Number.isNaN(paymentDayNum) ? paymentDayNum : null,
      insurance_type: values.insuranceType.trim() || null,
      insurance_amount:
        insuranceAmt != null && !Number.isNaN(insuranceAmt) ? insuranceAmt : null,
      extra_contacts: extra_contacts.length > 0 ? extra_contacts : null,
      full_contract_url: values.fullContractUrl ?? null,
      id_image_url: values.idImageUrl ?? null,
    };

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
      appAlert(
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
    ownerId: user?.uid ?? '',
  };
}
