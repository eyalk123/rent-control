import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePropertyContext, useLanguageContext } from '@/src/context';
import { usePaginatedTransactionContext } from '@/src/features/transactions/context/PaginatedTransactionContext';
import {
  bucketByMonth,
  currentMonthKey,
  monthYearLabel,
} from '@/src/features/transactions/utils/aggregate';
import type {
  FilterChip,
  FilterChipsBarHandle,
} from '@/src/features/transactions/components/list/FilterChipsBar';
import type { FilterOption } from '@/src/features/transactions/components/list/FilterBottomSheet';
import type { TransactionTypeFilter } from '@/src/features/transactions/components/list/TypeFilterChips';

export type ActiveSheet = 'property' | 'renter' | 'owner' | 'category' | 'supplier' | null;

export function useTransactionFilters() {
  const { t } = useTranslation();
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  const { transactions } = usePaginatedTransactionContext();
  const { properties } = usePropertyContext();

  const [propertyFilter, setPropertyFilter] = useState<number | null>(null);
  const [renterFilter, setRenterFilter] = useState<number | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<number | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');

  const filterChipsRef = useRef<FilterChipsBarHandle>(null);

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

  const categoryOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<number, string>();
    for (const tx of transactions) {
      if (tx.category_id !== null && tx.category_name && !seen.has(tx.category_id)) {
        seen.set(tx.category_id, tx.category_name);
      }
    }
    return [...seen.entries()].map(([id, rawName]) => ({
      id,
      label: t(`expenseCategories.${rawName}`, { defaultValue: rawName }),
    }));
  }, [transactions, t]);

  const supplierOptions = useMemo<FilterOption[]>(() => {
    const seen = new Map<number, string>();
    for (const tx of transactions) {
      if (tx.supplier_id !== null && tx.supplier_name && !seen.has(tx.supplier_id)) {
        seen.set(tx.supplier_id, tx.supplier_name);
      }
    }
    return [...seen.entries()].map(([id, label]) => ({ id, label }));
  }, [transactions]);

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
      if (categoryFilter !== null && tx.category_id !== categoryFilter) return false;
      if (supplierFilter !== null && tx.supplier_id !== supplierFilter) return false;
      return true;
    });
  }, [transactions, propertyFilter, renterFilter, ownerFilter, categoryFilter, supplierFilter, ownerByPropertyId]);

  const typeFiltered = useMemo(() => {
    if (typeFilter === 'all') return baseFiltered;
    return baseFiltered.filter((tx) => tx.type === typeFilter);
  }, [baseFiltered, typeFilter]);

  const currentKey = currentMonthKey();

  const listSections = useMemo(() => {
    const buckets = bucketByMonth(typeFiltered);
    return buckets.map((b) => ({
      key: b.key,
      title: monthYearLabel(b.key, locale),
      profit: b.profit,
      data: b.transactions,
    }));
  }, [typeFiltered, locale]);

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
      propertyFilter, renterFilter, ownerFilter, categoryFilter, supplierFilter]);

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
    filterChipsRef,
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
