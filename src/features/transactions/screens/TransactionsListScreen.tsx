import React, { useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { Checkbox, IconButton, Searchbar, Text, useTheme } from 'react-native-paper';
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
import { usePropertyContext, useLanguageContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
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
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();
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
  const propertyOwnerLowerById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of properties) {
      const o = (p.property_owner ?? '').trim();
      if (o) m.set(p.id, o.toLowerCase());
    }
    return m;
  }, [properties]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
      };
    }, [])
  );

  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase().trim();
    return transactions.filter((tx) => {
      const property = tx.property_name.toLowerCase();
      const propertyOwner = propertyOwnerLowerById.get(tx.property_id) ?? '';
      const renter = (tx.renter_name ?? '').toLowerCase();
      const category = (tx.category_name ?? '').toLowerCase();
      const supplier = (tx.supplier_name ?? '').toLowerCase();
      return (
        property.includes(q) ||
        propertyOwner.includes(q) ||
        renter.includes(q) ||
        category.includes(q) ||
        supplier.includes(q)
      );
    });
  }, [transactions, searchQuery, propertyOwnerLowerById]);

  const typeFiltered = useMemo(() => {
    if (typeFilter === 'all') return searchFiltered;
    return searchFiltered.filter((tx) => tx.type === typeFilter);
  }, [searchFiltered, typeFilter]);

  // Hero / chart use the searched (not type-filtered) set so that switching
  // the chip doesn't mutate the P&L story at the top of the screen.
  const allBuckets = useMemo(() => bucketByMonth(searchFiltered), [searchFiltered]);
  const sixMonthBuckets = useMemo(() => lastNMonths(allBuckets, 6), [allBuckets]);
  const currentKey = currentMonthKey();
  const heroBucket: MonthBucket = useMemo(
    () =>
      sixMonthBuckets.find((b) => b.key === currentKey) ??
      sixMonthBuckets[sixMonthBuckets.length - 1],
    [sixMonthBuckets, currentKey],
  );

  // List sections respect the type filter.
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

  const searchPlaceholder = rtlPlaceholder(
    t('search.placeholderTransactions', {
      defaultValue: 'Search transactions',
    }),
  );

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
    all: 'No transactions match your search.',
    revenue: 'No revenue in this period.',
    expense: 'No expenses in this period.',
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <LoadingOverlay visible={loading || deleting} />

      {/* Top header — title or selection-count */}
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
              <Searchbar
                placeholder={searchPlaceholder}
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={[styles.searchbar, { backgroundColor: colors.inputFilledBackground }]}
                inputStyle={rtlInputStyle}
              />
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
            icon={typeFilter === 'all' ? 'search' : 'wallet'}
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
  searchbar: {
    minHeight: 40,
    borderRadius: 10,
    elevation: 0,
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
