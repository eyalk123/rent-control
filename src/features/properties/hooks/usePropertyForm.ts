import React from 'react';
import { useAlert } from '@/src/core/context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import {
  createProperty,
  updateProperty,
  getPropertyById,
} from '@/src/features/properties/api/properties';
import {
  getPropertyFiles,
  bulkCreatePropertyFiles,
  deletePropertyFile,
} from '@/src/features/properties/api/propertyFilesApi';
import { getApiErrorMessage } from '@/src/core/api/client';
import type { Property, PropertyCreate, PropertyFile, PropertyType } from '@/src/shared/types';
import {
  propertyFormSchema,
  type PropertyFormValues,
  PROPERTY_TYPES,
} from '@/src/features/properties/validation/propertyValidation';
import { useFirebaseUpload } from '@/src/shared/hooks/useFirebaseUpload';
import {
  diffProvenance,
  updateExtractionLog,
} from '@/src/features/document-scan/api/updateExtractionLog';
import type { ProvenanceItem } from '@/src/features/document-scan/types';
import { diffScannedPropertyForm, type PropertyFormFieldConflict } from '@/src/features/document-scan/diffProperty';

type UsePropertyFormParams = {
  id?: string;
  t: TFunction;
  refreshProperties: () => Promise<void>;
  onSuccess: (savedProp: Property) => void;
  /** Document-scan prefill applied on a fresh (non-edit) form. */
  prefill?: Partial<PropertyFormValues>;
  /** Audit-log id + per-field provenance, to record what the user changed on submit. */
  logId?: number;
  provenance?: ProvenanceItem[];
};

const EMPTY_PROPERTY_FORM: PropertyFormValues = {
  address: '',
  city: '',
  block: '',
  plot: '',
  zipCode: '',
  type: '' as unknown as PropertyType,
  sqFt: '',
  numberOfRooms: '',
  parkingNumbersStr: '',
  propertyOwner: '',
  inventoryNotes: '',
  electricityMeterNumber: '',
  electricityAccountNumber: '',
  waterMeterNumber: '',
  waterAccountNumber: '',
  propertyTax: '',
  houseCommittee: '',
  basicContractUrl: null,
  landRegistryUrl: null,
  floor: '',
  apartment: '',
  pendingFiles: [],
};

function toOptionalNumber(s: string | undefined): number | null {
  return s && s.trim() !== '' ? Number(s) : null;
}

function propertyToFormValues(prop: Property): PropertyFormValues {
  return {
    address: prop.address ?? '',
    city: prop.city ?? '',
    block: prop.block ?? '',
    plot: prop.plot ?? '',
    zipCode: prop.zip_code ?? '',
    type: PROPERTY_TYPES.includes(prop.type as PropertyType)
      ? (prop.type as PropertyType)
      : ('' as unknown as PropertyType),
    sqFt: prop.sq_ft != null ? String(prop.sq_ft) : '',
    numberOfRooms: prop.number_of_rooms != null ? String(prop.number_of_rooms) : '',
    parkingNumbersStr:
      Array.isArray(prop.parking_numbers) && prop.parking_numbers.length > 0
        ? prop.parking_numbers.join(', ')
        : '',
    propertyOwner: prop.property_owner ?? '',
    inventoryNotes: prop.inventory_notes ?? '',
    electricityMeterNumber: prop.electricity_meter_number ?? '',
    electricityAccountNumber: prop.electricity_account_number ?? '',
    waterMeterNumber: prop.water_meter_number ?? '',
    waterAccountNumber: prop.water_account_number ?? '',
    propertyTax: prop.property_tax != null ? String(prop.property_tax) : '',
    houseCommittee: prop.house_committee != null ? String(prop.house_committee) : '',
    basicContractUrl: prop.basic_contract_url ?? null,
    landRegistryUrl: prop.land_registry_url ?? null,
    floor: prop.floor != null ? String(prop.floor) : '',
    apartment: prop.apartment ?? '',
  };
}

export function usePropertyForm({
  id,
  t,
  refreshProperties,
  onSuccess,
  prefill,
  logId,
  provenance,
}: UsePropertyFormParams) {
  const isEdit = Boolean(id);
  const { user } = useAppAuth();
  const { appAlert } = useAlert();
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [isFetching, setIsFetching] = React.useState<boolean>(isEdit);
  const [existingFiles, setExistingFiles] = React.useState<PropertyFile[]>([]);
  const [deletedFileIds, setDeletedFileIds] = React.useState<number[]>([]);
  // Scan attaching to an existing property: fields where the lease disagrees with the stored
  // value, for the user to keep or replace (mirrors the renter form).
  const [conflicts, setConflicts] = React.useState<PropertyFormFieldConflict[]>([]);
  const [conflictChoices, setConflictChoices] = React.useState<Record<string, 'keep' | 'update'>>({});
  const { uploadFile } = useFirebaseUpload('properties', user?.uid ?? '');

  const formMethods = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: { ...EMPTY_PROPERTY_FORM, ...(prefill ?? {}) },
    mode: 'onBlur',
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
    Promise.all([getPropertyById(numericId), getPropertyFiles(numericId)])
      .then(([prop, files]) => {
        const existingReset = propertyToFormValues(prop);
        // Scan attaching to this property: overlay the lease — fill blank fields silently and
        // surface differing ones for the user to keep or replace.
        if (prefill) {
          const { fills, conflicts: cf } = diffScannedPropertyForm(
            prefill as Record<string, unknown>,
            existingReset as unknown as Record<string, unknown>,
          );
          reset({ ...existingReset, ...fills });
          setConflicts(cf);
        } else {
          reset(existingReset);
          setConflicts([]);
        }
        setConflictChoices({});
        setImageUri(prop.image_url ?? null);
        setExistingFiles(files);
        setDeletedFileIds([]);
      })
      .finally(() => setIsFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch on id; prefill is stable per scan
  }, [id, isEdit, reset]);

  const submit = handleSubmit(async (values) => {
    const payload: PropertyCreate = {
      address: values.address,
      city: values.city,
      block: values.block?.trim() || null,
      plot: values.plot?.trim() || null,
      zip_code: values.zipCode,
      type: values.type,
      sq_ft: Number(values.sqFt),
      image_url: imageUri,
      number_of_rooms: toOptionalNumber(values.numberOfRooms),
      water_meter_number: values.waterMeterNumber || null,
      water_account_number: values.waterAccountNumber || null,
      electricity_account_number: values.electricityAccountNumber || null,
      property_tax: toOptionalNumber(values.propertyTax),
      house_committee: toOptionalNumber(values.houseCommittee),
      parking_numbers:
        values.parkingNumbersStr.trim() === ''
          ? null
          : values.parkingNumbersStr
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
      electricity_meter_number: values.electricityMeterNumber || null,
      property_owner: values.propertyOwner?.trim() || null,
      inventory_notes: values.inventoryNotes?.trim() || null,
      basic_contract_url: values.basicContractUrl ?? null,
      land_registry_url: values.landRegistryUrl ?? null,
      floor: toOptionalNumber(values.floor),
      apartment: values.apartment || null,
    };

    try {
      const savedProp = isEdit && id
        ? await updateProperty(Number(id), payload)
        : await createProperty(payload);

      // Audit: record which prefilled fields the user changed (scan flow — create or attach-edit).
      if (logId && provenance) {
        updateExtractionLog(logId, {
          entity_type: 'property',
          created_id: savedProp.id,
          ...diffProvenance(provenance, values as Record<string, unknown>),
        });
      }

      const pending = values.pendingFiles ?? [];
      if (pending.length > 0) {
        const uploaded = await Promise.all(
          pending.map((f) => uploadFile(f.localUri, f.name, f.mimeType ?? 'application/octet-stream').then((url) => ({ url, label: f.label || f.name })))
        );
        await bulkCreatePropertyFiles(savedProp.id, uploaded);
      }

      await Promise.all(
        deletedFileIds.map((fileId) => deletePropertyFile(savedProp.id, fileId))
      );

      await refreshProperties();
      reset({ ...propertyToFormValues(savedProp), pendingFiles: [] });
      setImageUri(savedProp.image_url ?? null);
      setExistingFiles([]);
      setDeletedFileIds([]);
      onSuccess(savedProp);
    } catch (err) {
      appAlert(
        t('error.title'),
        getApiErrorMessage(err, t('error.savePropertyFailed'))
      );
    }
  });

  // Scan-attach field conflicts + a resolver the screen wires to a keep/use-lease control.
  const resolveConflict = React.useCallback(
    (formKey: string, mode: 'keep' | 'update') => {
      const c = conflicts.find((x) => x.formKey === formKey);
      if (!c) return;
      setConflictChoices((prev) => ({ ...prev, [formKey]: mode }));
      formMethods.setValue(
        formKey as keyof PropertyFormValues,
        (mode === 'update' ? c.scanned : c.existing) as never,
        { shouldDirty: true },
      );
    },
    [conflicts, formMethods],
  );

  return {
    formMethods,
    onSubmit: submit,
    isSubmitting: formState.isSubmitting,
    isFetching,
    imageUri,
    setImageUri,
    ownerId: user?.uid ?? '',
    existingFiles,
    deletedFileIds,
    setDeletedFileIds,
    conflicts,
    conflictChoices,
    resolveConflict,
  };
}
