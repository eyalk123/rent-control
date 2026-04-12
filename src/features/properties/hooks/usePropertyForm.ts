import React from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import {
  createProperty,
  updateProperty,
  getPropertyById,
} from '@/src/features/properties/api/properties';
import { getApiErrorMessage } from '@/src/core/api/client';
import type { Property, PropertyCreate, PropertyType } from '@/src/shared/types';
import {
  propertyFormSchema,
  type PropertyFormValues,
  PROPERTY_TYPES,
} from '@/src/features/properties/validation/propertyValidation';

type UsePropertyFormParams = {
  id?: string;
  t: TFunction;
  refreshProperties: () => Promise<void>;
  onSuccess: () => void;
};

function toOptionalNumber(s: string | undefined): number | null {
  return s && s.trim() !== '' ? Number(s) : null;
}

function propertyToFormValues(prop: Property): PropertyFormValues {
  return {
    address: prop.address ?? '',
    city: prop.city ?? '',
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
    electricityMeterNumber: prop.electricity_meter_number ?? '',
    waterMeterTax: prop.water_meter_tax != null ? String(prop.water_meter_tax) : '',
    propertyTax: prop.property_tax != null ? String(prop.property_tax) : '',
    houseCommittee: prop.house_committee != null ? String(prop.house_committee) : '',
  };
}

export function usePropertyForm({
  id,
  t,
  refreshProperties,
  onSuccess,
}: UsePropertyFormParams) {
  const isEdit = Boolean(id);
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [isFetching, setIsFetching] = React.useState<boolean>(isEdit);

  const formMethods = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      address: '',
      city: '',
      zipCode: '',
      type: '' as unknown as PropertyType,
      sqFt: '',
      numberOfRooms: '',
      parkingNumbersStr: '',
      propertyOwner: '',
      electricityMeterNumber: '',
      waterMeterTax: '',
      propertyTax: '',
      houseCommittee: '',
    },
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
    getPropertyById(numericId)
      .then((prop) => {
        reset(propertyToFormValues(prop));
        setImageUri(prop.image_url ?? null);
      })
      .finally(() => setIsFetching(false));
  }, [id, isEdit, reset]);

  const submit = handleSubmit(async (values) => {
    const payload: PropertyCreate = {
      address: values.address,
      city: values.city,
      zip_code: values.zipCode,
      type: values.type,
      sq_ft: Number(values.sqFt),
      image_url: imageUri,
      number_of_rooms: toOptionalNumber(values.numberOfRooms),
      water_meter_tax: toOptionalNumber(values.waterMeterTax),
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
    };

    try {
      const savedProp = isEdit && id
        ? await updateProperty(Number(id), payload)
        : await createProperty(payload);
      await refreshProperties();
      reset(propertyToFormValues(savedProp));
      setImageUri(savedProp.image_url ?? null);
      onSuccess();
    } catch (err) {
      Alert.alert(
        t('error.title'),
        getApiErrorMessage(err, t('error.savePropertyFailed'))
      );
    }
  });

  return {
    formMethods,
    onSubmit: submit,
    isSubmitting: formState.isSubmitting,
    isFetching,
    imageUri,
    setImageUri,
  };
}
