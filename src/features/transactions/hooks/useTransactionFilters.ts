import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePropertyContext, useLanguageContext } from '@/src/context';
import { usePaginatedTransactionContext } from '@/src/features/transactions/context/PaginatedTransactionContext';
import { useExpenseCategories, useSuppliers } from '@/src/features/transactions/hooks/useTransactions';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';
import {
  bucketByMonth,
  currentMonthKey,
  monthYearLabel,
} from '@/src/features/transactions/utils/aggregate';
import type { FilterChip } from '@/src/features/transactions/components/list/FilterChipsBar';
import type { FilterOption } from '@/src/features/transactions/components/list/FilterBottomSheet';
import type { TransactionTypeFilter } from '@/src/features/transactions/components/list/TypeFilterChips';

export type ActiveSheet = 'property' | 'renter' | 'owner' | 'category' | 'supplier' | null;

export function useTransactionFilters() {
  const { t } = useTranslation();
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const {
    transactions,
    hasMore,
    serverFilters,
    setCategoryFilter,
    setSupplierFilter,
  } = usePaginatedTransactionContext();
  const { properties } = usePropertyContext();
  const { categories } = useExpenseCategories();
  const { suppliers } = useSuppliers({ includeInactive: true });

  const [propertyFilter, setPropertyFilter] = useState<number | null>(null);
  const [renterFilter, setRenterFilter] = useState<number | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  // Category and supplier are filtered by the server (see PaginatedTransactionContext), so
  // they live there rather than here.
  const { categoryId: categoryFilter, supplierId: supplierFilter } = serverFilters;
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');

  const propertyOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<number, string>();
    for (const tx of transactions) {
      if (!seen.has(tx.property_id)) seen.set(tx.property_id, tx.property_name);
    }
    return [...seen.entries()].map(([id, label]) => ({ id, label }));
  }, [transactions]);

  const renterOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<number, string>();
    for (const tx of transactions) {
      if (tx.renter_id !== null && tx.renter_name && !seen.has(tx.renter_id)) {
        seen.set(tx.renter_id, tx.renter_name);
      }
    }
    return [...seen.entries()].map(([id, label]) => ({ id, label }));
  }, [transactions]);

  const ownerOptions = useMemo<FilterOption[]>(() => {
    const seen = new Set<string>();
    for (const p of properties) {
      const o = (p.property_owner ?? '').trim();
      if (o) seen.add(o);
    }
    return [...seen].map((o) => ({ id: o, label: o }));
  }, [properties]);

  // Every category and supplier the account has, not only those on the pages loaded so
  // far - the server does the filtering, so a match need not be on screen yet. Ones seen
  // on loaded rows are added too, which covers a category that has since been deactivated.
  const categoryOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<number, string>();
    for (const c of categories) seen.set(c.id, getCategoryDisplayName(c, t));
    for (const tx of transactions) {
      if (tx.category_id !== null && tx.category_name && !seen.has(tx.category_id)) {
        seen.set(
          tx.category_id,
          t(`expenseCategories.${tx.category_name}`, { defaultValue: tx.category_name }),
        );
      }
    }
    return [...seen.entries()].map(([id, label]) => ({ id, label }));
  }, [categories, transactions, t]);

  const supplierOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<number, string>();
    for (const s of suppliers) seen.set(s.id, s.name);
    for (const tx of transactions) {
      if (tx.supplier_id !== null && tx.supplier_name && !seen.has(tx.supplier_id)) {
        seen.set(tx.supplier_id, tx.supplier_name);
      }
    }
    return [...seen.entries()].map(([id, label]) => ({ id, label }));
  }, [suppliers, transactions]);

  const ownerByPropertyId = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of properties) {
      const o = (p.property_owner ?? '').trim();
      if (o) m.set(p.id, o);
    }
    return m;
  }, [properties]);

  const baseFiltered = useMemo(() => {
    return transactions.filter((tx) => {
      if (propertyFilter !== null && tx.property_id !== propertyFilter) return false;
      if (renterFilter !== null && tx.renter_id !== renterFilter) return false;
      if (ownerFilter !== null && ownerByPropertyId.get(tx.property_id) !== ownerFilter) return false;
      // The server already applied these two; repeating them here narrows the rows still
      // on screen from before the filter changed, until the filtered page arrives.
      if (
        categoryFilter !== null &&
        tx.category_id !== categoryFilter &&
        !tx.category_ids?.includes(categoryFilter)
      ) return false;
      if (supplierFilter !== null && tx.supplier_id !== supplierFilter) return false;
      return true;
    });
  }, [transactions, propertyFilter, renterFilter, ownerFilter, categoryFilter, supplierFilter, ownerByPropertyId]);

  const typeFiltered = useMemo(() => {
    if (typeFilter === 'all') return baseFiltered;
    return baseFiltered.filter((tx) => tx.type === typeFilter);
  }, [baseFiltered, typeFilter]);

  const currentKey = currentMonthKey();

  /**
   * Sections, newest month first, each flagged with whether it is whole.
   *
   * The server paginates in effective-date order (see `effectiveDate`), so a month can only
   * be half-loaded if it is the *oldest* one on screen - the moment a row of an older month
   * arrives, every newer month is exhausted. That last month is whole only once the pager
   * says there is nothing left to fetch. Anything else would show a running subtotal that
   * silently changes as the reader scrolls.
   */
  const listSections = useMemo(() => {
    const buckets = bucketByMonth(typeFiltered);
    return buckets.map((b, i) => ({
      key: b.key,
      title: monthYearLabel(b.key, locale),
      profit: b.profit,
      complete: i < buckets.length - 1 || !hasMore,
      data: b.transactions,
    }));
  }, [typeFiltered, locale, hasMore]);

  const filterChips = useMemo<FilterChip[]>(() => [
    {
      key: 'property',
      label: t('filters.property', { defaultValue: 'Property' }),
      selectedLabel: propertyOptions.find((o) => o.id === propertyFilter)?.label ?? null,
      onPress: () => setActiveSheet('property'),
      onClear: () => setPropertyFilter(null),
    },
    {
      key: 'renter',
      label: t('filters.renter', { defaultValue: 'Renter' }),
      selectedLabel: renterOptions.find((o) => o.id === renterFilter)?.label ?? null,
      onPress: () => setActiveSheet('renter'),
      onClear: () => setRenterFilter(null),
    },
    {
      key: 'owner',
      label: t('filters.owner', { defaultValue: 'Owner' }),
      selectedLabel: ownerFilter,
      onPress: () => setActiveSheet('owner'),
      onClear: () => setOwnerFilter(null),
    },
    {
      key: 'category',
      label: t('filters.category', { defaultValue: 'Category' }),
      selectedLabel: categoryOptions.find((o) => o.id === categoryFilter)?.label ?? null,
      onPress: () => setActiveSheet('category'),
      onClear: () => setCategoryFilter(null),
    },
    {
      key: 'supplier',
      label: t('filters.supplier', { defaultValue: 'Supplier' }),
      selectedLabel: supplierOptions.find((o) => o.id === supplierFilter)?.label ?? null,
      onPress: () => setActiveSheet('supplier'),
      onClear: () => setSupplierFilter(null),
    },
  ], [t, propertyOptions, renterOptions, categoryOptions, supplierOptions,
      propertyFilter, renterFilter, ownerFilter, categoryFilter, supplierFilter,
      setCategoryFilter, setSupplierFilter]);

  return {
    propertyFilter,
    setPropertyFilter,
    renterFilter,
    setRenterFilter,
    ownerFilter,
    setOwnerFilter,
    categoryFilter,
    setCategoryFilter,
    supplierFilter,
    setSupplierFilter,
    activeSheet,
    setActiveSheet,
    typeFilter,
    setTypeFilter,
    propertyOptions,
    renterOptions,
    ownerOptions,
    categoryOptions,
    supplierOptions,
    baseFiltered,
    typeFiltered,
    listSections,
    filterChips,
    currentKey,
  };
}
