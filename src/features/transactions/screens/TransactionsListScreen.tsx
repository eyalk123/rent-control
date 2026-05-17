import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
} from 'react-native';
import { useTheme } from 'react-native-paper';
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
import { useLanguageContext } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useTransactionSummaryContext } from '@/src/features/transactions/context/TransactionSummaryContext';
import { usePaginatedTransactionContext } from '@/src/features/transactions/context/PaginatedTransactionContext';
import type { Transaction } from '@/src/shared/types';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { TransactionRow } from '@/src/features/transactions/components/list/TransactionRow';
import { useTransactionFilters } from '@/src/features/transactions/hooks/useTransactionFilters';
import { useTransactionSelectMode } from '@/src/features/transactions/hooks/useTransactionSelectMode';
import { SelectionHeader } from '@/src/features/transactions/components/list/SelectionHeader';
import { TransactionsListHeader } from '@/src/features/transactions/components/list/TransactionsListHeader';
import { TransactionSectionHeader } from '@/src/features/transactions/components/list/TransactionSectionHeader';
import { TransactionListFABs } from '@/src/features/transactions/components/list/TransactionListFABs';
import { TransactionFilterSheets } from '@/src/features/transactions/components/list/TransactionFilterSheets';
import { SuppliersHeaderButton } from '@/src/features/transactions/components/list/SuppliersHeaderButton';

const EMPTY_KEY: Record<string, string> = {
  all: 'empty.noTransactionSearchResults',
  revenue: 'empty.noRevenueThisPeriod',
  expense: 'empty.noExpenseThisPeriod',
};

const EMPTY_DEFAULT: Record<string, string> = {
  all: 'No transactions match your filters.',
  revenue: 'No revenue in this period.',
  expense: 'No expenses in this period.',
};

export function TransactionsListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, isRtl } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const {
    transactions,
    loadingMore,
    error,
    loadMore,
    refresh,
  } = usePaginatedTransactionContext();

  const { sixMonthBuckets, heroBucket, summaryLoading, refresh: refreshSummary } = useTransactionSummaryContext();

  const filters = useTransactionFilters();

  const selectMode = useTransactionSelectMode({
    typeFiltered: filters.typeFiltered,
    refresh,
    refreshSummary,
  });

  const [refreshing, setRefreshing] = useState(false);

  const { filterChipsRef } = filters;
  const { exitSelectMode } = selectMode;

  useFocusEffect(
    React.useCallback(() => {
      filterChipsRef.current?.scrollToStart();
      return () => {
        exitSelectMode();
      };
    }, [filterChipsRef, exitSelectMode])
  );

  React.useEffect(() => {
    filterChipsRef.current?.scrollToStart();
  }, [language, filterChipsRef]);

  const handleAddPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/transactions/add' as any);
  }, [router]);

  const handleSuppliersPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/transactions/suppliers' as any);
  }, [router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refresh(), refreshSummary()]);
    setRefreshing(false);
  }, [refresh, refreshSummary]);

  if (error && transactions.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <EmptyState
          message={error}
          icon="alert-circle"
          actionLabel={t('common.tryAgain')}
          onAction={refresh}
        />
        <SuppliersHeaderButton colors={colors} onPress={handleSuppliersPress} label={t('suppliers.title')} />
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
        <SuppliersHeaderButton colors={colors} onPress={handleSuppliersPress} label={t('suppliers.title')} />
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

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <LoadingOverlay visible={selectMode.deleting} />

      {selectMode.isSelectMode && (
        <SelectionHeader
          allSelected={selectMode.allSelected}
          someSelected={selectMode.someSelected}
          selectedCount={selectMode.selectedIds.size}
          onToggleAll={selectMode.handleToggleAll}
          onCancel={selectMode.handleCancelSelect}
        />
      )}

      <SectionList
        sections={filters.listSections}
        keyExtractor={(item) => item.id.toString()}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <TransactionsListHeader
            filterChipsRef={filters.filterChipsRef}
            filterChips={filters.filterChips}
            typeFilter={filters.typeFilter}
            onTypeFilterChange={filters.setTypeFilter}
            heroBucket={heroBucket}
            sixMonthBuckets={sixMonthBuckets}
            currentKey={filters.currentKey}
            summaryLoading={summaryLoading}
          />
        }
        renderSectionHeader={({ section }) => (
          <TransactionSectionHeader
            title={section.title}
            profit={(section as { profit: number }).profit}
          />
        )}
        renderItem={({ item }: { item: Transaction }) => (
          <DevProfiler id="TransactionRow" group="TransactionRow">
            <TransactionRow
              transaction={item}
              locale={locale}
              t={t}
              isSelectMode={selectMode.isSelectMode}
              isSelected={selectMode.selectedIds.has(item.id)}
              onPress={selectMode.handleTransactionPress}
              onLongPress={selectMode.handleLongPress}
            />
          </DevProfiler>
        )}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator style={{ paddingVertical: spacing.lg }} color={theme.colors.primary} />
            : null
        }
        contentContainerStyle={[
          { paddingHorizontal: spacing.lg },
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
            message={t(EMPTY_KEY[filters.typeFilter], {
              defaultValue: EMPTY_DEFAULT[filters.typeFilter],
            })}
            icon={filters.typeFilter === 'all' ? 'filter' : 'wallet'}
          />
        }
      />

      <TransactionListFABs
        isSelectMode={selectMode.isSelectMode}
        selectedCount={selectMode.selectedIds.size}
        onDelete={selectMode.handleDeleteSelected}
        onAdd={handleAddPress}
        bottomInset={insets.bottom}
      />

      {!selectMode.isSelectMode && (
        <SuppliersHeaderButton colors={colors} onPress={handleSuppliersPress} label={t('suppliers.title')} />
      )}

      <TransactionFilterSheets
        activeSheet={filters.activeSheet}
        onClose={() => filters.setActiveSheet(null)}
        propertyOptions={filters.propertyOptions}
        renterOptions={filters.renterOptions}
        ownerOptions={filters.ownerOptions}
        categoryOptions={filters.categoryOptions}
        supplierOptions={filters.supplierOptions}
        onSelectProperty={filters.setPropertyFilter}
        onSelectRenter={filters.setRenterFilter}
        onSelectOwner={filters.setOwnerFilter}
        onSelectCategory={filters.setCategoryFilter}
        onSelectSupplier={filters.setSupplierFilter}
        propertyFilter={filters.propertyFilter}
        renterFilter={filters.renterFilter}
        ownerFilter={filters.ownerFilter}
        categoryFilter={filters.categoryFilter}
        supplierFilter={filters.supplierFilter}
      />
    </ScreenContainer>
  );
}
