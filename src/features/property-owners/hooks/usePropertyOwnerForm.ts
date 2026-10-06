import React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { capabilities } from '@/src/shared/utils/capabilities';
import { useAlert } from '@/src/core/context';
import { getApiErrorMessage } from '@/src/core/api/client';
import {
  createPropertyOwner,
  getPropertyOwnerById,
  isPropertyOwnerConflict,
  updatePropertyOwner,
} from '@/src/features/property-owners/api/propertyOwners';
import {
  propertyOwnerFormSchema,
  type PropertyOwnerFormValues,
} from '@/src/features/property-owners/validation/propertyOwnerValidation';
import { isValidBankAccount } from '@/src/shared/components/form/BankAccountInput';
import type { PropertyOwnerCreate } from '@/src/shared/types';

type UsePropertyOwnerFormParams = {
  id?: string;
  t: TFunction;
  onSuccess: () => void;
  /** A name to start a new owner from — what a scanned lease called them. */
  initialName?: string;
};

const EMPTY: PropertyOwnerFormValues = {
  name: '',
  phone: '',
  email: '',
  notes: '',
  bankAccount: { bank: '', branch: '', account: '' },
  paymentDetails: '',
};

export function usePropertyOwnerForm({ id, t, onSuccess, initialName }: UsePropertyOwnerFormParams) {
  const isEdit = Boolean(id);
  const { appAlert } = useAlert();
  const [isFetching, setIsFetching] = React.useState<boolean>(isEdit);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const formMethods = useForm<PropertyOwnerFormValues>({
    resolver: zodResolver(propertyOwnerFormSchema) as Resolver<PropertyOwnerFormValues>,
    // Prefilled, not typed: a default rather than a change, so leaving asks nothing.
    defaultValues: { ...EMPTY, name: initialName ?? '' },
    mode: 'onBlur',
  });
  const { reset, handleSubmit, setError, formState } = formMethods;

  React.useEffect(() => {
    const numericId = Number(id);
    if (!isEdit || Number.isNaN(numericId)) {
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    getPropertyOwnerById(numericId)
      .then((owner) => {
        // Stored as one string, shown two ways — the same arrangement as the supplier form.
        const structured = capabilities().structuredBankDetails;
        const parts = structured && owner.bank_account ? owner.bank_account.split('/') : [];
        reset({
          name: owner.name ?? '',
          phone: owner.phone ?? '',
          email: owner.email ?? '',
          notes: owner.notes ?? '',
          bankAccount: { bank: parts[0] ?? '', branch: parts[1] ?? '', account: parts[2] ?? '' },
          paymentDetails: structured ? '' : (owner.bank_account ?? ''),
        });
      })
      .catch((err) => setFetchError(getApiErrorMessage(err, t('error.loadFailed'))))
      .finally(() => setIsFetching(false));
  }, [id, isEdit, reset]);

  const submit = handleSubmit(async (values) => {
    const payload: PropertyOwnerCreate = {
      name: values.name.trim(),
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      notes: values.notes?.trim() || null,
      bank_account: !capabilities().structuredBankDetails
        ? (values.paymentDetails?.trim() || null)
        : isValidBankAccount(values.bankAccount)
        ? `${values.bankAccount.bank}/${values.bankAccount.branch}/${values.bankAccount.account}`
        : null,
    };

    try {
      if (isEdit && id) {
        await updatePropertyOwner(Number(id), payload);
      } else {
        await createPropertyOwner(payload);
      }
      reset(values);
      onSuccess();
    } catch (err) {
      if (isPropertyOwnerConflict(err)) {
        // The backend's message is English; this one is translated and sits on the field.
        setError('name', { message: 'propertyOwners.nameTaken' });
        return;
      }
      appAlert(t('error.title'), getApiErrorMessage(err, t('error.saveFailed')));
    }
  });

  return {
    formMethods,
    onSubmit: submit,
    isSubmitting: formState.isSubmitting,
    isFetching,
    fetchError,
  };
}
