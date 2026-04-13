import React, { useMemo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useExpenseCategories } from '@/src/features/transactions/hooks/useTransactions';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';
import { DropdownField } from '@/src/shared/components/form';

interface ExpenseCategoryPickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
}

export function ExpenseCategoryPicker({
  value,
  onChange,
  label,
  inputStyle,
}: ExpenseCategoryPickerProps) {
  const { t } = useTranslation();
  const { categories } = useExpenseCategories();

  const data = useMemo(
    () =>
      categories.map((c) => ({
        label: getCategoryDisplayName(c, t),
        value: c.id,
      })),
    [categories, t],
  );

  return (
    <DropdownField
      data={data}
      value={value}
      onChange={onChange}
      label={label ?? t('transactions.category', { defaultValue: 'Category' })}
      inputStyle={inputStyle}
    />
  );
}
