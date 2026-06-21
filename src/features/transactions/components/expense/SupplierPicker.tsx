import React, { useMemo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSuppliers } from '@/src/features/transactions/hooks/useTransactions';
import { DropdownField } from '@/src/shared/components/form';

interface SupplierPickerProps {
  categoryIds: number[];
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
  allowNone?: boolean;
}

export function SupplierPicker({
  categoryIds,
  value,
  onChange,
  label,
  inputStyle,
  allowNone = true,
}: SupplierPickerProps) {
  const { t } = useTranslation();
  const { suppliers } = useSuppliers(categoryIds);

  const data = useMemo<{ label: string; value: number | null }[]>(() => {
    const filtered =
      categoryIds.length > 0
        ? suppliers.filter(
            (s) =>
              s.is_active !== false &&
              s.category_ids?.some((cid) => categoryIds.includes(cid)),
          )
        : [];

    const items = filtered.map((s) => ({ label: s.name, value: s.id }));
    return allowNone
      ? [{ label: t('transactions.noSupplier'), value: null }, ...items]
      : items;
  }, [allowNone, categoryIds, suppliers, t]);

  return (
    <DropdownField
      data={data}
      value={value}
      onChange={onChange}
      label={label ?? t('transactions.supplier', { defaultValue: 'Supplier' })}
      disabled={categoryIds.length === 0}
      inputStyle={inputStyle}
    />
  );
}
