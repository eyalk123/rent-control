import React from 'react';
import { useAlert } from '@/src/core/context';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { getApiErrorMessage } from '@/src/core/api/client';
import {
  createSupplier,
  getSupplierById,
  updateSupplier,
} from '@/src/features/suppliers/api/suppliers';
import type { SupplierCreate, SupplierUpdate } from '@/src/shared/types';
import {
  supplierFormSchema,
  type SupplierFormValues,
} from '@/src/features/suppliers/validation/supplierValidation';
import { isValidBankAccount } from '@/src/shared/components/form/BankAccountInput';

type UseSupplierFormParams = {
  id?: string;
  t: TFunction;
  refreshSuppliers: () => Promise<void>;
  onSuccess: () => void;
};

export function useSupplierForm({
  id,
  t,
  refreshSuppliers,
  onSuccess,
}: UseSupplierFormParams) {
  const isEdit = Boolean(id);
  const { appAlert } = useAlert();
  const [isFetching, setIsFetching] = React.useState<boolean>(isEdit);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const formMethods = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema) as Resolver<SupplierFormValues>,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      notes: '',
      categoryIds: [],
      bankAccount: { bank: '', branch: '', account: '' },
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
    getSupplierById(numericId)
      .then((supplier) => {
        const parsedBankAccount = (() => {
          if (!supplier.bank_account) return { bank: '', branch: '', account: '' };
          const parts = supplier.bank_account.split('/');
          return {
            bank: parts[0] ?? '',
            branch: parts[1] ?? '',
            account: parts[2] ?? '',
          };
        })();
        reset({
          name: supplier.name ?? '',
          phone: supplier.phone ?? '',
          email: supplier.email ?? '',
          notes: supplier.notes ?? '',
          categoryIds: supplier.category_ids ?? [],
          bankAccount: parsedBankAccount,
        });
      })
      .catch((err) => {
        setFetchError(getApiErrorMessage(err, t('error.loadFailed')));
      })
      .finally(() => {
        setIsFetching(false);
      });
  }, [id, isEdit, reset]);

  const submit = handleSubmit(async (values) => {
    const serialisedBankAccount = isValidBankAccount(values.bankAccount)
      ? `${values.bankAccount.bank}/${values.bankAccount.branch}/${values.bankAccount.account}`
      : null;

    const baseCreate: SupplierCreate = {
      name: values.name.trim(),
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      notes: values.notes?.trim() || null,
      bank_account: serialisedBankAccount,
      category_ids: values.categoryIds,
    };

    const baseUpdate: SupplierUpdate = {
      name: values.name.trim(),
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      notes: values.notes?.trim() || null,
      bank_account: serialisedBankAccount,
      category_ids: values.categoryIds,
    };

    try {
      if (isEdit && id) {
        const numericId = Number(id);
        await updateSupplier(numericId, baseUpdate);
      } else {
        await createSupplier(baseCreate);
      }

      await refreshSuppliers();
      reset(values);
      onSuccess();
    } catch (err) {
      appAlert(
        t('error.title'),
        getApiErrorMessage(err, t('error.saveFailed')),
      );
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
