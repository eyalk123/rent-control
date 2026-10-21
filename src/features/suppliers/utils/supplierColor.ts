import type { ExpenseCategory, Supplier } from '@/src/shared/types';

/**
 * A supplier's color: the color of its first category that has one. Suppliers store no color
 * of their own; a plumber filed under Maintenance reads in Maintenance's color, the same as
 * the chips beside his name. Null (the neutral shade) when no category has a color.
 */
export function supplierColorKey(
  supplier: Pick<Supplier, 'category_ids'>,
  categories: readonly ExpenseCategory[],
): string | null {
  for (const id of supplier.category_ids ?? []) {
    const color = categories.find((c) => c.id === id)?.color;
    if (color) return color;
  }
  return null;
}
