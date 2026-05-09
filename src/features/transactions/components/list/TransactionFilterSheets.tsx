import { useTranslation } from 'react-i18next';
import {
  FilterBottomSheet,
  type FilterOption,
} from '@/src/features/transactions/components/list/FilterBottomSheet';
import type { ActiveSheet } from '@/src/features/transactions/hooks/useTransactionFilters';

interface TransactionFilterSheetsProps {
  activeSheet: ActiveSheet;
  onClose: () => void;
  propertyOptions: FilterOption[];
  renterOptions: FilterOption[];
  ownerOptions: FilterOption[];
  categoryOptions: FilterOption[];
  supplierOptions: FilterOption[];
  onSelectProperty: (id: number | null) => void;
  onSelectRenter: (id: number | null) => void;
  onSelectOwner: (id: string | null) => void;
  onSelectCategory: (id: number | null) => void;
  onSelectSupplier: (id: number | null) => void;
  propertyFilter: number | null;
  renterFilter: number | null;
  ownerFilter: string | null;
  categoryFilter: number | null;
  supplierFilter: number | null;
}

export function TransactionFilterSheets({
  activeSheet,
  onClose,
  propertyOptions,
  renterOptions,
  ownerOptions,
  categoryOptions,
  supplierOptions,
  onSelectProperty,
  onSelectRenter,
  onSelectOwner,
  onSelectCategory,
  onSelectSupplier,
  propertyFilter,
  renterFilter,
  ownerFilter,
  categoryFilter,
  supplierFilter,
}: TransactionFilterSheetsProps) {
  const { t } = useTranslation();

  return (
    <>
      <FilterBottomSheet
        visible={activeSheet === 'property'}
        onDismiss={onClose}
        title={t('filters.property', { defaultValue: 'Property' })}
        options={propertyOptions}
        selectedId={propertyFilter}
        onSelect={(id) => onSelectProperty(id as number | null)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'renter'}
        onDismiss={onClose}
        title={t('filters.renter', { defaultValue: 'Renter' })}
        options={renterOptions}
        selectedId={renterFilter}
        onSelect={(id) => onSelectRenter(id as number | null)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'owner'}
        onDismiss={onClose}
        title={t('filters.owner', { defaultValue: 'Owner' })}
        options={ownerOptions}
        selectedId={ownerFilter}
        onSelect={(id) => onSelectOwner(id as string | null)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'category'}
        onDismiss={onClose}
        title={t('filters.category', { defaultValue: 'Category' })}
        options={categoryOptions}
        selectedId={categoryFilter}
        onSelect={(id) => onSelectCategory(id as number | null)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'supplier'}
        onDismiss={onClose}
        title={t('filters.supplier', { defaultValue: 'Supplier' })}
        options={supplierOptions}
        selectedId={supplierFilter}
        onSelect={(id) => onSelectSupplier(id as number | null)}
      />
    </>
  );
}
