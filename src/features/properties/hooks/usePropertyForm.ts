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
import type { PropertyCreate, PropertyUpdate, PropertyType } from '@/src/shared/types';
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
      purchasePrice: '',
      numberOfRooms: '',
      parkingNumbersStr: '',
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
        reset({
          address: prop.address ?? '',
          city: prop.city ?? '',
          zipCode: prop.zip_code ?? '',
          type: PROPERTY_TYPES.includes(prop.type as PropertyType)
            ? (prop.type as PropertyType)
            : ('' as unknown as PropertyType),
          sqFt: prop.sq_ft != null ? String(prop.sq_ft) : '',
          purchasePrice: prop.purchase_price != null ? String(prop.purchase_price) : '',
          numberOfRooms: prop.number_of_rooms != null ? String(prop.number_of_rooms) : '',
          parkingNumbersStr:
            Array.isArray(prop.parking_numbers) && prop.parking_numbers.length > 0
              ? prop.parking_numbers.join(', ')
              : '',
          electricityMeterNumber: prop.electricity_meter_number ?? '',
          waterMeterTax: prop.water_meter_tax != null ? String(prop.water_meter_tax) : '',
          propertyTax: prop.property_tax != null ? String(prop.property_tax) : '',
          houseCommittee: prop.house_committee != null ? String(prop.house_committee) : '',
        });
        setImageUri(prop.image_url ?? null);
      })
      .finally(() => setIsFetching(false));
  }, [id, isEdit, reset]);

  const submit = handleSubmit(async (values) => {
    const sqFtNum = Number(values.sqFt);
    const purchasePriceNum = Number(values.purchasePrice);

    const numberOfRoomsNum =
      values.numberOfRooms && values.numberOfRooms.trim() !== ''
        ? Number(values.numberOfRooms)
        : null;

    const waterMeterTaxNum =
      values.waterMeterTax && values.waterMeterTax.trim() !== ''
        ? Number(values.waterMeterTax)
        : null;

    const propertyTaxNum =
      values.propertyTax && values.propertyTax.trim() !== ''
        ? Number(values.propertyTax)
        : null;

    const houseCommitteeNum =
      values.houseCommittee && values.houseCommittee.trim() !== ''
        ? Number(values.houseCommittee)
        : null;

    const parkingNumbersParsed =
      values.parkingNumbersStr.trim() === ''
        ? null
        : values.parkingNumbersStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

    const createData: PropertyCreate = {
      address: values.address,
      city: values.city,
      zip_code: values.zipCode,
      type: values.type,
      sq_ft: sqFtNum,
      purchase_price: purchasePriceNum,
    };

    createData.image_url = imageUri;
    if (numberOfRoomsNum != null) createData.number_of_rooms = numberOfRoomsNum;
    if (parkingNumbersParsed != null && parkingNumbersParsed.length > 0) {
      createData.parking_numbers = parkingNumbersParsed;
    }
    if (values.electricityMeterNumber) {
      createData.electricity_meter_number = values.electricityMeterNumber;
    }
    if (waterMeterTaxNum != null) createData.water_meter_tax = waterMeterTaxNum;
    if (propertyTaxNum != null) createData.property_tax = propertyTaxNum;
    if (houseCommitteeNum != null) createData.house_committee = houseCommitteeNum;

    const updateData: PropertyUpdate = {
      address: values.address,
      city: values.city,
      zip_code: values.zipCode,
      type: values.type,
      sq_ft: sqFtNum,
      purchase_price: purchasePriceNum,
    };
    updateData.image_url = imageUri;
    if (numberOfRoomsNum != null) updateData.number_of_rooms = numberOfRoomsNum;
    if (parkingNumbersParsed != null && parkingNumbersParsed.length > 0) {
      updateData.parking_numbers = parkingNumbersParsed;
    }
    if (values.electricityMeterNumber) {
      updateData.electricity_meter_number = values.electricityMeterNumber;
    }
    if (waterMeterTaxNum != null) updateData.water_meter_tax = waterMeterTaxNum;
    if (propertyTaxNum != null) updateData.property_tax = propertyTaxNum;
    if (houseCommitteeNum != null) updateData.house_committee = houseCommitteeNum;

    try {
      if (isEdit && id) {
        await updateProperty(Number(id), updateData);
      } else {
        await createProperty(createData);
      }

      await refreshProperties();
      reset(values);
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
