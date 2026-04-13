import React, { useMemo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSuppliers } from '@/src/features/transactions/hooks/useTransactions';
import { DropdownField } from '@/src/shared/components/form';

interface SupplierPickerProps {
  categoryId: number | null;
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
  allowNone?: boolean;
}

export function SupplierPicker({
  categoryId,
  value,
  onChange,
  label,
  inputStyle,
  allowNone = true,
}: SupplierPickerProps) {
  const { t } = useTranslation();
  const { suppliers } = useSuppliers(categoryId ?? undefined);

  const data = useMemo<{ label: string; value: number | null }[]>(() => {
    const filtered = categoryId
      ? suppliers.filter(
          (s) =>
            s.is_active !== false &&
            (s.category_ids?.includes(categoryId) ?? false),
        )
      : [];

    const items = filtered.map((s) => ({ label: s.name, value: s.id }));
    return allowNone
      ? [{ label: t('renter.unassigned'), value: null }, ...items]
      : items;
  }, [allowNone, categoryId, suppliers, t]);

  return (
    <DropdownField
      data={data}
      value={value}
      onChange={onChange}
      label={label ?? t('transactions.supplier', { defaultValue: 'Supplier' })}
      disabled={!categoryId}
      inputStyle={inputStyle}
    />
  );
}
