import React, { useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Checkbox, FAB, IconButton, Searchbar, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, LoadingOverlay, ScreenContainer } from '@/src/shared/components/ui';
import { usePropertyContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import type { Transaction } from '@/src/shared/types';
import { useTransactionsList } from '@/src/features/transactions/hooks/useTransactions';
import { TransactionSummaryCards } from '@/src/features/transactions/components/TransactionSummaryCards';
import { deleteTransaction } from '@/src/features/transactions/api/transactions';
import { formatMoney } from '@/src/shared/utils/money';

type TransactionTypeFilter = 'all' | 'revenue' | 'expense';

export function TransactionsListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();

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

  const isFirstFocus = React.useRef(true);
  useFocusEffect(
    React.useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refreshTransactions();
    }, [refreshTransactions]),
  );

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

  const searchFilteredTransactions = useMemo(() => {
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

  const filteredTransactions = useMemo(() => {
    if (typeFilter === 'all') return searchFilteredTransactions;
    return searchFilteredTransactions.filter((tx) => tx.type === typeFilter);
  }, [searchFilteredTransactions, typeFilter]);

  const summary = useMemo(() => {
    const toNumber = (n: unknown) => {
      if (n == null) return 0;
      const num = Number(n);
      return isNaN(num) ? 0 : num;
    };
    const revenue = searchFilteredTransactions
      .filter((tx) => tx.type === 'revenue')
      .reduce((sum, tx) => sum + toNumber(tx.amount), 0);
    const expenses = searchFilteredTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + toNumber(tx.amount), 0);
    return { revenue, expenses, profitLoss: revenue - expenses };
  }, [searchFilteredTransactions]);

  const allSelected = filteredTransactions.length > 0 && filteredTransactions.every((tx) => selectedIds.has(tx.id));
  const someSelected = !allSelected && filteredTransactions.some((tx) => selectedIds.has(tx.id));

  const searchPlaceholder = rtlPlaceholder(t('search.placeholderTransactions', {
    defaultValue: 'Search transactions',
  }));

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/transactions/add' as any);
  };

  const handleTransactionPress = (id: number) => {
    if (isSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
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
      setSelectedIds(new Set(filteredTransactions.map((tx) => tx.id)));
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
      ]
    );
  };

  const onRefresh = async () => {
    await refreshTransactions();
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isRevenue = item.type === 'revenue';
    const typeLabel = isRevenue
      ? t('transactions.typeRevenue', { defaultValue: 'Revenue' })
      : t('transactions.typeExpense', { defaultValue: 'Expense' });

    const amountColor = isRevenue ? colors.chooseRevenueIcon : colors.chooseExpenseIcon;
    const cardBg = isRevenue ? colors.chooseRevenueBg : colors.chooseExpenseBg;
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        onPress={() => handleTransactionPress(item.id)}
        onLongPress={() => handleLongPress(item.id)}
        activeOpacity={isSelectMode ? 0.6 : 1}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: colors.outline,
            },
          ]}
        >
          {isSelectMode && (
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => handleTransactionPress(item.id)}
              style={styles.checkbox}
            />
          )}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {item.property_name}
            </Text>
            <Text style={[styles.amount, { color: amountColor }]}>
              {formatMoney(item.amount)}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.chip, { color: colors.textPrimary }]}>
              {typeLabel}
            </Text>
            {item.renter_name ? (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.renter_name}
              </Text>
            ) : null}
            {item.category_name ? (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {t(`expenseCategories.${item.category_name.toLowerCase()}`, {
                  defaultValue: item.category_name,
                })}
              </Text>
            ) : null}
            {item.supplier_name ? (
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {item.supplier_name}
              </Text>
            ) : null}
          </View>
          <View style={styles.cardFooter}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {item.date_of_payment}
            </Text>
            {item.month_for ? (
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                {t('transactions.monthFor', {
                  defaultValue: 'For: {{month}}',
                  month: item.month_for,
                })}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <ScreenContainer>
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
      <ScreenContainer>
        <EmptyState
          message={t('empty.noTransactions', {
            defaultValue: 'No transactions yet. Tap + to add one.',
          })}
          icon="cash-multiple"
        />
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom }]}
          onPress={handleAddPress}
          accessibilityLabel={t('transactions.addTransaction', {
            defaultValue: 'Add transaction',
          })}
          accessibilityRole="button"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LoadingOverlay visible={loading || deleting} />
      <View style={styles.header}>
        {isSelectMode ? (
          <View style={styles.selectionHeader}>
            <Checkbox
              status={allSelected ? 'checked' : someSelected ? 'indeterminate' : 'unchecked'}
              onPress={handleToggleAll}
            />
            <Text variant="headlineMedium" style={styles.heroTitle}>
              {t('bulkDelete.selected', { count: selectedIds.size })}
            </Text>
            <IconButton icon="close" onPress={handleCancelSelect} />
          </View>
        ) : (
          <Text variant="headlineLarge" style={styles.heroTitle}>
            {t('screens.transactions', { defaultValue: 'Transactions' })}
          </Text>
        )}
        <Searchbar
          placeholder={searchPlaceholder}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={rtlInputStyle}
        />
        <TransactionSummaryCards summary={summary} />
        <SegmentedButtons
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as TransactionTypeFilter)}
          buttons={[
            {
              value: 'all',
              label: t('transactions.filterAll', { defaultValue: 'All' }),
            },
            {
              value: 'revenue',
              label: t('transactions.filterRevenue', { defaultValue: 'Revenues' }),
            },
            {
              value: 'expense',
              label: t('transactions.filterExpense', { defaultValue: 'Expenses' }),
            },
          ]}
          style={styles.segmented}
        />
      </View>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
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
            message={t('empty.noTransactionSearchResults', {
              defaultValue: 'No transactions match your search.',
            })}
            icon="magnify"
          />
        }
      />
      {isSelectMode ? (
        <FAB
          icon="trash-can"
          style={[styles.fab, { bottom: insets.bottom, backgroundColor: theme.colors.error }]}
          color={theme.colors.onError}
          onPress={handleDeleteSelected}
          disabled={selectedIds.size === 0}
          accessibilityLabel={t('bulkDelete.deleteButton')}
          accessibilityRole="button"
        />
      ) : (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom }]}
          onPress={handleAddPress}
          accessibilityLabel={t('transactions.addTransaction', {
            defaultValue: 'Add transaction',
          })}
          accessibilityRole="button"
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTitle: {
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 28,
    flex: 1,
  },
  searchbar: {
    minHeight: 40,
    borderRadius: 10,
  },
  segmented: {
    marginTop: spacing.xs,
  },
  list: {
    paddingBottom: 80,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
  },
  checkbox: {
    marginBottom: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    marginRight: spacing.sm,
  },
  amount: {
    fontWeight: '700',
    fontSize: 16,
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  chip: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
    color: 'gray',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    color: 'gray',
  },
  fab: {
    position: 'absolute',
    margin: spacing.sm,
    right: 0,
  },
});
