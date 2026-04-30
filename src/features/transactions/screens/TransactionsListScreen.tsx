import React, { useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { Checkbox, IconButton, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppFab,
  EmptyState,
  LoadingOverlay,
  ScreenContainer,
} from '@/src/shared/components/ui';
import { usePropertyContext, useLanguageContext } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import type { Transaction } from '@/src/shared/types';
import { useTransactionsList } from '@/src/features/transactions/hooks/useTransactions';
import { deleteTransaction } from '@/src/features/transactions/api/transactions';
import { formatMoney } from '@/src/shared/utils/money';
import {
  bucketByMonth,
  lastNMonths,
  monthYearLabel,
  type MonthBucket,
} from '@/src/features/transactions/utils/aggregate';
import { TransactionsHero } from '@/src/features/transactions/components/list/TransactionsHero';
import { MonthsBarChart } from '@/src/features/transactions/components/list/MonthsBarChart';
import {
  TypeFilterChips,
  type TransactionTypeFilter,
} from '@/src/features/transactions/components/list/TypeFilterChips';
import { TransactionRow } from '@/src/features/transactions/components/list/TransactionRow';
import {
  FilterChipsBar,
  type FilterChip,
} from '@/src/features/transactions/components/list/FilterChipsBar';
import {
  FilterBottomSheet,
  type FilterOption,
} from '@/src/features/transactions/components/list/FilterBottomSheet';

type ActiveSheet = 'property' | 'renter' | 'owner' | 'category' | 'supplier' | null;

const currentMonthKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export function TransactionsListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const {
    transactions,
    loading,
    error,
    refreshing,
    refreshTransactions,
    retryLoad,
  } = useTransactionsList();

  const { properties } = usePropertyContext();

  // Filter state
  const [propertyFilter, setPropertyFilter] = useState<number | null>(null);
  const [renterFilter, setRenterFilter] = useState<number | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<number | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const [chipScrollSignal, setChipScrollSignal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setChipScrollSignal((s) => s + 1);
      return () => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
      };
    }, [])
  );

  React.useEffect(() => {
    setChipScrollSignal((s) => s + 1);
  }, [language]);

  // Derive filter options from transaction data — only shows values present in the list
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

  // Owner lookup by property_id for filtering
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

  // Hero / chart use the base-filtered (not type-filtered) set
  const allBuckets = useMemo(() => bucketByMonth(baseFiltered), [baseFiltered]);
  const sixMonthBuckets = useMemo(() => lastNMonths(allBuckets, 6), [allBuckets]);
  const currentKey = currentMonthKey();
  const heroBucket: MonthBucket = useMemo(
    () =>
      sixMonthBuckets.find((b) => b.key === currentKey) ??
      sixMonthBuckets[sixMonthBuckets.length - 1],
    [sixMonthBuckets, currentKey],
  );

  const listSections = useMemo(() => {
    const buckets = bucketByMonth(typeFiltered);
    return buckets.map((b) => ({
      key: b.key,
      title: monthYearLabel(b.key, locale),
      profit: b.profit,
      data: b.transactions,
    }));
  }, [typeFiltered, locale]);

  const allSelected =
    typeFiltered.length > 0 && typeFiltered.every((tx) => selectedIds.has(tx.id));
  const someSelected =
    !allSelected && typeFiltered.some((tx) => selectedIds.has(tx.id));

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
  ], [t, propertyOptions, renterOptions, ownerOptions, categoryOptions, supplierOptions,
      propertyFilter, renterFilter, ownerFilter, categoryFilter, supplierFilter]);

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/transactions/add' as any);
  };

  const handleTransactionPress = (id: number) => {
    if (isSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const handleLongPress = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSelectMode(true);
    setSelectedIds(new Set([id]));
  };

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(typeFiltered.map((tx) => tx.id)));
    }
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    Alert.alert(
      t('bulkDelete.deleteConfirmTitle', { count }),
      t('bulkDelete.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('bulkDelete.deleteButton'),
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const ids = Array.from(selectedIds);
            let success = 0;
            let failed = 0;
            for (const id of ids) {
              try {
                await deleteTransaction(id);
                success++;
              } catch {
                failed++;
              }
            }
            await refreshTransactions();
            setDeleting(false);
            setIsSelectMode(false);
            setSelectedIds(new Set());
            if (failed > 0) {
              Alert.alert(t('bulkDelete.partialError', { success, failed }));
            }
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    await refreshTransactions();
  };

  if (loading && transactions.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <EmptyState
          message={error}
          icon="alert-circle"
          actionLabel={t('common.tryAgain')}
          onAction={retryLoad}
        />
      </ScreenContainer>
    );
  }

  if (transactions.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <EmptyState
          message={t('empty.noTransactions', {
            defaultValue: 'No transactions yet. Tap + to add one.',
          })}
          icon="wallet"
        />
        <AppFab
          icon="plus"
          onPress={handleAddPress}
          accessibilityLabel={t('transactions.addTransaction', {
            defaultValue: 'Add transaction',
          })}
          bottomInset={insets.bottom}
        />
      </ScreenContainer>
    );
  }

  const emptyKey: Record<TransactionTypeFilter, string> = {
    all: 'empty.noTransactionSearchResults',
    revenue: 'empty.noRevenueThisPeriod',
    expense: 'empty.noExpenseThisPeriod',
  };
  const emptyDefault: Record<TransactionTypeFilter, string> = {
    all: 'No transactions match your filters.',
    revenue: 'No revenue in this period.',
    expense: 'No expenses in this period.',
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <LoadingOverlay visible={loading || deleting} />

      <View style={styles.titleRow}>
        {isSelectMode ? (
          <View style={styles.selectionHeader}>
            <Checkbox
              status={
                allSelected ? 'checked' : someSelected ? 'indeterminate' : 'unchecked'
              }
              onPress={handleToggleAll}
            />
            <Text variant="headlineMedium" style={styles.heroTitle}>
              {t('bulkDelete.selected', { count: selectedIds.size })}
            </Text>
            <IconButton icon="close" onPress={handleCancelSelect} />
          </View>
        ) : null}
      </View>

      <SectionList
        sections={listSections}
        keyExtractor={(item) => item.id.toString()}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <View>
            <TransactionsHero bucket={heroBucket} />
            <MonthsBarChart buckets={sixMonthBuckets} currentKey={currentKey} />
            <View style={[styles.filterCard, { backgroundColor: theme.colors.surface }]}>
              <FilterChipsBar chips={filterChips} resetSignal={chipScrollSignal} />
              <TypeFilterChips value={typeFilter} onChange={setTypeFilter} />
            </View>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const profit = (section as { profit: number }).profit;
          const isLoss = profit < 0;
          const sign = isLoss ? '−' : '+';
          const color = isLoss ? colors.expFg : colors.revFg;
          return (
            <View
              style={[
                styles.sectionHeader,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                {section.title}
              </Text>
              <Text style={[styles.sectionProfit, { color }]}>
                {`${sign}${formatMoney(Math.abs(profit))}`}
              </Text>
            </View>
          );
        }}
        renderItem={({ item }: { item: Transaction }) => (
          <TransactionRow
            transaction={item}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(item.id)}
            onPress={() => handleTransactionPress(item.id)}
            onLongPress={() => handleLongPress(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: 80 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            message={t(emptyKey[typeFilter], {
              defaultValue: emptyDefault[typeFilter],
            })}
            icon={typeFilter === 'all' ? 'filter' : 'wallet'}
          />
        }
      />

      {isSelectMode ? (
        <AppFab
          icon="trash"
          variant="destructive"
          onPress={handleDeleteSelected}
          disabled={selectedIds.size === 0}
          accessibilityLabel={t('bulkDelete.deleteButton')}
          bottomInset={insets.bottom}
        />
      ) : (
        <AppFab
          icon="plus"
          onPress={handleAddPress}
          accessibilityLabel={t('transactions.addTransaction', {
            defaultValue: 'Add transaction',
          })}
          bottomInset={insets.bottom}
        />
      )}

      <FilterBottomSheet
        visible={activeSheet === 'property'}
        onDismiss={() => setActiveSheet(null)}
        title={t('filters.property', { defaultValue: 'Property' })}
        options={propertyOptions}
        selectedId={propertyFilter}
        onSelect={(id) => setPropertyFilter(id as number | null)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'renter'}
        onDismiss={() => setActiveSheet(null)}
        title={t('filters.renter', { defaultValue: 'Renter' })}
        options={renterOptions}
        selectedId={renterFilter}
        onSelect={(id) => setRenterFilter(id as number | null)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'owner'}
        onDismiss={() => setActiveSheet(null)}
        title={t('filters.owner', { defaultValue: 'Owner' })}
        options={ownerOptions}
        selectedId={ownerFilter}
        onSelect={(id) => setOwnerFilter(id as string | null)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'category'}
        onDismiss={() => setActiveSheet(null)}
        title={t('filters.category', { defaultValue: 'Category' })}
        options={categoryOptions}
        selectedId={categoryFilter}
        onSelect={(id) => setCategoryFilter(id as number | null)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'supplier'}
        onDismiss={() => setActiveSheet(null)}
        title={t('filters.supplier', { defaultValue: 'Supplier' })}
        options={supplierOptions}
        selectedId={supplierFilter}
        onSelect={(id) => setSupplierFilter(id as number | null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    paddingHorizontal: spacing.lg,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  heroTitle: {
    fontWeight: '700',
    fontSize: 28,
    flex: 1,
  },
  filterCard: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: 16,
    padding: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionProfit: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
