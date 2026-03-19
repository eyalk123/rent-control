import type { TFunction } from 'i18next';
import type { ExpenseCategory } from '@/src/shared/types';

export function getCategoryDisplayName(
  category: ExpenseCategory,
  t: TFunction,
): string {
  if (category.name) return category.name;
  if (category.key)
    return t(`expenseCategories.${category.key}`, {
      defaultValue: category.key,
    });
  return '';
}
