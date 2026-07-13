import React from "react";
import { useAlert } from "@/src/core/context";
import { useAppAuth } from "@/src/core/auth/AuthContext";
import { useForm, type DefaultValues } from "react-hook-form";
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
import { useFirebaseUpload } from "@/src/shared/hooks/useFirebaseUpload";
import type { PickedFile } from "@/src/features/document-scan/api/extractLease";
import {
  diffProvenance,
  updateExtractionLog,
} from "@/src/features/document-scan/api/updateExtractionLog";
import { diffScannedRenter, type RenterFieldConflict } from "@/src/features/document-scan/diffRenter";
import type { ProvenanceItem } from "@/src/features/document-scan/types";

/** The form holds the payment day as a date-shaped string ("2000-01-DD"); pull the day out.
 *  Parse it as a real ISO date instead of slicing fixed offsets: `slice(8, 10)` silently
 *  turned a malformed "2000-01-521234567" into 52 — a plausible-looking wrong number that
 *  no client check caught. Anything that isn't a well-formed date with a day in 1..31 is
 *  rejected outright (null) rather than truncated into something believable. */
const parsePaymentDay = (value: string | undefined | null): number | null => {
  const match = /^\d{4}-\d{2}-(\d{2})$/.exec((value ?? "").trim());
  if (!match) return null;
  const day = Number(match[1]);
  return day >= 1 && day <= 31 ? day : null;
};

type UseRenterFormParams = {
  id?: string;
  t: TFunction;
  refreshRenters: () => Promise<void>;
  onSuccess: () => void;
  initialPropertyId?: number | null;
  /** Document-scan prefill applied on a fresh (non-edit) form. */
  prefill?: Partial<RenterFormValues>;
  /** Bumped by the multi-renter scan flow to re-seed the form with the next co-tenant's
   *  prefill (a fresh value re-runs the reset for the next renter in the queue). */
  prefillNonce?: number;
  /** Set when the current scanned renter matched an existing renter on the attached property:
   *  the form edits that renter in place (prefill from stored data, fill blanks from the scan,
   *  resolve conflicts) instead of creating a duplicate. */
  existingRenterId?: number | null;
  /** Scanned lease to upload as the renter's full contract on submit. */
  pendingFullContract?: PickedFile | null;
  /** Audit-log id + per-field provenance, to record what the user changed on submit. */
  logId?: number;
  provenance?: ProvenanceItem[];
};

export function useRenterForm({
  id,
  t,
  refreshRenters,
  onSuccess,
  initialPropertyId = null,
  prefill,
  prefillNonce = 0,
  existingRenterId = null,
  pendingFullContract = null,
  logId,
  provenance,
}: UseRenterFormParams) {
  // The renter being edited: an explicit route id (plain edit) or the existing renter a scanned
  // duplicate matched. `isDuplicateScan` also overlays the scan values onto that renter.
  const routeId = id && !Number.isNaN(Number(id)) ? Number(id) : null;
  const effId = routeId ?? existingRenterId ?? null;
  const isEdit = effId != null;
  const isDuplicateScan = routeId == null && existingRenterId != null;
  const { user } = useAppAuth();
  const { appAlert } = useAlert();
  const { uploadFile } = useFirebaseUpload("renters", user?.uid ?? "");
  const [isFetching, setIsFetching] = React.useState<boolean>(isEdit);
  const [conflicts, setConflicts] = React.useState<RenterFieldConflict[]>([]);
  const [conflictChoices, setConflictChoices] = React.useState<Record<string, "keep" | "update">>({});
  // The scanned lease vs. a contract the matched renter already has. Tracked apart from the scalar
  // conflicts because the choice drives `fullContractUrl` (and so the submit-time upload).
  const [contractConflict, setContractConflict] = React.useState<{ existingUrl: string } | null>(null);
  const [contractChoice, setContractChoice] = React.useState<"keep" | "update">("keep");

  const buildDefaults = React.useCallback(
    (pf?: Partial<RenterFormValues>): RenterFormValues => ({
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
      ...(pf ?? {}),
    }),
    [initialPropertyId],
  );

  const formMethods = useForm<RenterFormValues>({
    resolver: zodResolver(renterFormSchema),
    defaultValues: buildDefaults(prefill),
    mode: "onBlur",
  });

  const { reset, handleSubmit, formState } = formMethods;

  // Multi-renter scan: when the screen advances to the next co-tenant it bumps prefillNonce,
  // re-seeding the form with that renter's prefill. Skip the initial mount (defaults already
  // applied) and never clobber an edit form.
  const nonceRef = React.useRef(prefillNonce);
  React.useEffect(() => {
    if (isEdit) return; // duplicate/edit entries re-seed from the fetch effect below
    if (nonceRef.current === prefillNonce) return;
    nonceRef.current = prefillNonce;
    reset(buildDefaults(prefill));
    setConflicts([]);
    setConflictChoices({});
    setContractConflict(null);
    setContractChoice("keep");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires only when prefillNonce changes
  }, [prefillNonce]);

  React.useEffect(() => {
    if (!isEdit || effId == null) {
      setIsFetching(false);
      return;
    }
    const numericId = effId;
    nonceRef.current = prefillNonce; // keep the fresh-form re-seed guard in sync as the queue advances
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
        const existingReset: DefaultValues<RenterFormValues> = {
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
        };
        // Duplicate scan entry: overlay scan values onto the existing renter — fill the fields it
        // left blank silently, and surface the ones that differ for the user to keep or replace.
        if (isDuplicateScan && prefill) {
          const labelByKey = new Map(
            (provenance ?? []).map((pv) => [pv.formKey, pv.labelKey] as [string, string]),
          );
          const { fills, conflicts: cf } = diffScannedRenter(
            prefill as Record<string, unknown>,
            existingReset as Record<string, unknown>,
            labelByKey,
          );
          reset({ ...existingReset, ...fills });
          setConflicts(cf);
          // The scanned lease is the renter's contract: it uploads on submit whenever
          // `fullContractUrl` is empty (the file analogue of a `fill`). When the renter already has
          // one, offer keep/replace instead of silently discarding the freshly scanned lease.
          if (pendingFullContract && renter.full_contract_url) {
            setContractConflict({ existingUrl: renter.full_contract_url });
            setContractChoice("keep");
          } else {
            setContractConflict(null);
          }
        } else {
          reset(existingReset);
          setConflicts([]);
          setContractConflict(null);
        }
        setConflictChoices({});
      })
      .finally(() => setIsFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch on effId/queue advance
  }, [effId, isEdit, prefillNonce, reset]);

  const submit = handleSubmit(async (values) => {
    // Attach the scanned lease as the full contract (uploaded only now, on submit).
    let resolvedFullContractUrl = values.fullContractUrl ?? null;
    if (pendingFullContract && !resolvedFullContractUrl) {
      try {
        resolvedFullContractUrl = await uploadFile(
          pendingFullContract.localUri,
          pendingFullContract.name,
          pendingFullContract.mimeType,
        );
      } catch {
        // Don't block saving the renter if the contract upload fails.
      }
    }
    const leaseStartTrimmed = values.leaseStart?.trim() ?? "";
    const paymentDayNum = parsePaymentDay(values.paymentDate);
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
      full_contract_url: resolvedFullContractUrl,
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
      full_contract_url: resolvedFullContractUrl,
      id_image_url: values.idImageUrl ?? null,
    };

    try {
      if (isEdit && effId != null) {
        await updateRenter(effId, baseUpdate);
      } else {
        const created = await createRenter(baseCreate);
        // Audit: record renter creation + changed fields + the kept contract URL.
        if (logId && provenance) {
          updateExtractionLog(logId, {
            entity_type: "renter",
            created_id: (created as { id?: number })?.id ?? null,
            contract_url: resolvedFullContractUrl,
            ...diffProvenance(provenance, values as Record<string, unknown>),
          });
        }
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

  // Scan-duplicate field conflicts + a resolver the screen wires to a keep/use-lease control.
  const resolveConflict = React.useCallback(
    (formKey: string, mode: "keep" | "update") => {
      const c = conflicts.find((x) => x.formKey === formKey);
      if (!c) return;
      setConflictChoices((prev) => ({ ...prev, [formKey]: mode }));
      formMethods.setValue(
        formKey as keyof RenterFormValues,
        (mode === "update" ? c.scanned : c.existing) as never,
        { shouldDirty: true },
      );
    },
    [conflicts, formMethods],
  );

  // Keeping the stored contract restores its URL, so submit() finds `fullContractUrl` set and skips
  // the upload; replacing it clears the URL, which is what lets the scanned lease upload instead.
  const resolveContractConflict = React.useCallback(
    (mode: "keep" | "update") => {
      if (!contractConflict) return;
      setContractChoice(mode);
      formMethods.setValue(
        "fullContractUrl",
        mode === "keep" ? contractConflict.existingUrl : null,
        { shouldDirty: true },
      );
    },
    [contractConflict, formMethods],
  );

  return {
    formMethods,
    onSubmit: submit,
    isSubmitting: formState.isSubmitting,
    isFetching,
    ownerId: user?.uid ?? '',
    conflicts,
    conflictChoices,
    resolveConflict,
    contractConflict,
    contractChoice,
    resolveContractConflict,
  };
}
