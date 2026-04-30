import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { EmptyState, LoadingOverlay } from '@/src/shared/components/ui';
import { useTransactionsList } from '@/src/features/transactions/hooks/useTransactions';
import { lightColors, darkColors, spacing } from '@/src/core/theme';
import type { Transaction } from '@/src/shared/types';
import { formatMoney } from '@/src/shared/utils/money';

type TransactionTypeFilter = 'all' | 'revenue' | 'expense';

interface PropertyTransactionsTabProps {
  propertyId: number;
}

export function PropertyTransactionsTab({ propertyId }: PropertyTransactionsTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const {
    transactions,
    loading,
    refreshing,
    error,
    refreshTransactions,
    retryLoad,
  } = useTransactionsList({ propertyId });

  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all');

  const filteredTransactions = useMemo(() => {
    if (typeFilter === 'all') return transactions;
    return transactions.filter((tx) => tx.type === typeFilter);
  }, [transactions, typeFilter]);

  const renderItem = ({ item }: { item: Transaction }) => {
    const isRevenue = item.type === 'revenue';
    const typeLabel = isRevenue
      ? t('transactions.typeRevenue')
      : t('transactions.typeExpense');
    const amountColor = isRevenue ? colors.chooseRevenueIcon : colors.chooseExpenseIcon;
    const cardBg = isRevenue ? colors.chooseRevenueBg : colors.chooseExpenseBg;

    return (
      <View
        style={[styles.txCard, { backgroundColor: cardBg, borderColor: colors.outline }]}
      >
        <View style={styles.txHeader}>
          <Text style={[styles.txType, { color: colors.textPrimary }]}>
            {typeLabel}
          </Text>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {formatMoney(item.amount)}
          </Text>
        </View>
        <View style={styles.txMeta}>
          {item.renter_name ? (
            <Text style={[styles.txMetaText, { color: colors.textSecondary }]}>
              {item.renter_name}
            </Text>
          ) : null}
          {item.category_name ? (
            <Text style={[styles.txMetaText, { color: colors.textSecondary }]}>
              {t(`expenseCategories.${item.category_name.toLowerCase()}`, {
                defaultValue: item.category_name,
              })}
            </Text>
          ) : null}
        </View>
        <View style={styles.txFooter}>
          <Text style={[styles.txFooterText, { color: colors.textSecondary }]}>
            {item.date_of_payment}
          </Text>
          {item.month_for ? (
            <Text style={[styles.txFooterText, { color: colors.textSecondary }]}>
              {t('transactions.monthFor', { month: item.month_for })}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.centered}>
        <LoadingOverlay visible />
      </View>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          message={error}
          icon="alert-circle"
          actionLabel={t('common.tryAgain')}
          onAction={retryLoad}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <SegmentedButtons
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as TransactionTypeFilter)}
          buttons={[
            { value: 'all', label: t('transactions.filterAll') },
            { value: 'revenue', label: t('transactions.filterRevenue') },
            { value: 'expense', label: t('transactions.filterExpense') },
          ]}
        />
      </View>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshTransactions}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            message={t('property.noTransactions')}
            icon="wallet"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  filterRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  txCard: {
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  txType: {
    fontWeight: '600',
    fontSize: 14,
  },
  txAmount: {
    fontWeight: '700',
    fontSize: 16,
  },
  txMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  txMetaText: {
    fontSize: 12,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txFooterText: {
    fontSize: 12,
  },
});
