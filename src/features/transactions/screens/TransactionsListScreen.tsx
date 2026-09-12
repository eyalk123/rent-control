import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
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
import { TransactionsListHeader, TITLE_ROW_HEIGHT_FALLBACK } from '@/src/features/transactions/components/list/TransactionsListHeader';
import { TransactionSectionHeader } from '@/src/features/transactions/components/list/TransactionSectionHeader';
import { TransactionListFABs } from '@/src/features/transactions/components/list/TransactionListFABs';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour } from '@/src/features/onboarding/TourController';
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

const LIST_ANCHOR = { flex: 1 } as const;

/** Carries the gap that used to sit on top of the section header, where - because that
 *  header sticks - it padded the pinned month away from the status bar instead of
 *  separating two months. Hoisted so the list is not handed a new component each render. */
const renderSectionFooter = () => <View style={styles.sectionFooter} />;

const styles = StyleSheet.create({
  sectionFooter: {
    height: spacing.sm,
  },
  /** Fixed height so the content size never changes as the spinner comes and goes. */
  footer: {
    height: 52,
    justifyContent: 'center',
  },
  footerHidden: {
    opacity: 0,
  },
});

export function TransactionsListScreen() {
  // Gated on having properties: a money screen with nothing in it teaches nothing, and a
  // failed gate defers rather than consuming the tour.
  useTour('transactions-list');
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const {
    transactions,
    loadingMore,
    error,
    loadMore,
    refresh,
  } = usePaginatedTransactionContext();

  const { sixMonthBuckets, heroBucket, summaryLoading, summaryError, refresh: refreshSummary } =
    useTransactionSummaryContext();

  const filters = useTransactionFilters();

  const selectMode = useTransactionSelectMode({
    typeFiltered: filters.typeFiltered,
    refresh,
    refreshSummary,
  });

  const [refreshing, setRefreshing] = useState(false);
  // Measured from the list header; the floating Suppliers button sits below it.
  const [titleRowHeight, setTitleRowHeight] = useState(TITLE_ROW_HEIGHT_FALLBACK);
  const [selectedKey, setSelectedKey] = useState(filters.currentKey);

  const selectedBucket =
    sixMonthBuckets.find((b) => b.key === selectedKey) ?? heroBucket;

  const handleSelectMonth = useCallback((key: string) => {
    setSelectedKey(key);
  }, []);

  const { exitSelectMode } = selectMode;

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        exitSelectMode();
      };
    }, [exitSelectMode])
  );

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

      {/* flex:1 so the wrapper does not collapse and shrink the list it contains. */}
      <TourAnchor id={ANCHORS.transactionsList} style={LIST_ANCHOR}>
      <SectionList
        sections={filters.listSections}
        keyExtractor={(item) => item.id.toString()}
        stickySectionHeadersEnabled
        ListHeaderComponent={
          <TransactionsListHeader
            filterChips={filters.filterChips}
            typeFilter={filters.typeFilter}
            onTypeFilterChange={filters.setTypeFilter}
            heroBucket={selectedBucket}
            sixMonthBuckets={sixMonthBuckets}
            selectedKey={selectedKey}
            onSelectMonth={handleSelectMonth}
            summaryLoading={summaryLoading}
            summaryError={summaryError}
            onRetrySummary={refreshSummary}
            onTitleRowLayout={(h) =>
              setTitleRowHeight((prev) => (Math.abs(prev - h) < 0.5 ? prev : h))
            }
          />
        }
        renderSectionFooter={renderSectionFooter}
        renderSectionHeader={({ section }) => (
          <TransactionSectionHeader
            title={section.title}
            profit={(section as { profit: number }).profit}
            complete={(section as { complete: boolean }).complete}
            anchorId={
              section === filters.listSections[0]
                ? ANCHORS.transactionsMonthHeader
                : undefined
            }
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
        // In viewport-heights. At 0.4 a fast fling outran the fetch and slammed into the
        // end of the content on every throw; asking for the next page a screen and a half
        // early means the list keeps having somewhere to go.
        onEndReachedThreshold={1.5}
        // Always rendered, always the same height. Swapping this between null and a
        // spinner changed the content height by the spinner's ~52dp, and the scroll was
        // pinned to the end of the content at exactly that moment - so the list lurched
        // 52dp up and back down on every page. That is the twitch.
        ListFooterComponent={
          <View style={styles.footer}>
            <ActivityIndicator
              animating={loadingMore}
              color={theme.colors.primary}
              style={!loadingMore && styles.footerHidden}
            />
          </View>
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
      </TourAnchor>

      <TransactionListFABs
        isSelectMode={selectMode.isSelectMode}
        selectedCount={selectMode.selectedIds.size}
        onDelete={selectMode.handleDeleteSelected}
        onAdd={handleAddPress}
        bottomInset={insets.bottom}
      />

      {!selectMode.isSelectMode && (
        <SuppliersHeaderButton
          colors={colors}
          onPress={handleSuppliersPress}
          label={t('suppliers.title')}
          titleRowHeight={titleRowHeight}
        />
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
