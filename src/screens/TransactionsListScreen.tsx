import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { FAB, Searchbar, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState, LoadingOverlay, ScreenContainer } from '@/src/components';
import { useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/theme';
import type { Transaction } from '@/src/types';
import { useTransactionsList } from '@/src/hooks/useTransactions';

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
  } = useTransactionsList();

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

  const filteredTransactions = useMemo(() => {
    let list = transactions;

    if (typeFilter !== 'all') {
      list = list.filter((tx) => tx.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((tx) => {
        const property = tx.property_name.toLowerCase();
        const renter = (tx.renter_name ?? '').toLowerCase();
        const category = (tx.category_name ?? '').toLowerCase();
        const supplier = (tx.supplier_name ?? '').toLowerCase();
        return (
          property.includes(q) ||
          renter.includes(q) ||
          category.includes(q) ||
          supplier.includes(q)
        );
      });
    }

    return list;
  }, [transactions, typeFilter, searchQuery]);

  const searchPlaceholder = rtlPlaceholder(t('search.placeholderTransactions', {
    defaultValue: 'Search transactions',
  }));

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/transactions/add' as any);
  };

  const onRefresh = async () => {
    await refreshTransactions();
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const isRevenue = item.type === 'revenue';
    const typeLabel = isRevenue
      ? t('transactions.typeRevenue', { defaultValue: 'Revenue' })
      : t('transactions.typeExpense', { defaultValue: 'Expense' });

    const amountColor = isRevenue ? theme.colors.primary : theme.colors.error;

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.outline,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {item.property_name}
          </Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {item.amount.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}{' '}
            {item.currencyCode}
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
              {item.category_name}
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
        <EmptyState message={error} icon="alert-circle" />
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
          style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
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
      <LoadingOverlay visible={loading} />
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.heroTitle}>
          {t('screens.transactions', { defaultValue: 'Transactions' })}
        </Text>
        <Searchbar
          placeholder={searchPlaceholder}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={rtlInputStyle}
        />
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
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={handleAddPress}
        accessibilityLabel={t('transactions.addTransaction', {
          defaultValue: 'Add transaction',
        })}
        accessibilityRole="button"
      />
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
  heroTitle: {
    fontWeight: '700',
    marginBottom: spacing.xs,
    fontSize: 28,
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
    margin: spacing.lg,
    end: 0,
  },
});

