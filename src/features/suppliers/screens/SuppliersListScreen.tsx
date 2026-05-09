import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Searchbar, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import {
  AppFab,
  ContactActionsRow,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
} from '@/src/shared/components/ui';
import { useSuppliersList } from '@/src/features/suppliers/hooks/useSuppliersList';
import { useExpenseCategories } from '@/src/features/transactions/hooks/useTransactions';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';
import type { Supplier } from '@/src/shared/types';
import { spacing } from '@/src/core/theme';

export function SuppliersListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    suppliers,
    loading,
    error,
    refreshSuppliers,
    retryLoad,
  } = useSuppliersList();
  const { categories } = useExpenseCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshSuppliers();
    }, [refreshSuppliers]),
  );

  const filteredSuppliers = useMemo(() => {
    let list = suppliers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((supplier) => {
        const name = (supplier.name ?? '').toLowerCase();
        const phone = (supplier.phone ?? '').toLowerCase();
        const email = (supplier.email ?? '').toLowerCase();
        return name.includes(q) || phone.includes(q) || email.includes(q);
      });
    }
    return list;
  }, [suppliers, searchQuery]);

  const handleSupplierPress = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/transactions/suppliers/${id}` as any);
  };

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/transactions/suppliers/add' as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSuppliers();
    setRefreshing(false);
  };

  const getCategoryNames = (supplier: Supplier): string => {
    const ids = supplier.category_ids ?? [];
    return ids
      .map((id) => {
        const cat = categories.find((c) => c.id === id);
        return cat ? getCategoryDisplayName(cat, t) : null;
      })
      .filter(Boolean)
      .join(', ');
  };

  if (loading && suppliers.length === 0) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error && suppliers.length === 0) {
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

  if (suppliers.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          message={t('suppliers.noSuppliers', { defaultValue: 'No suppliers yet' })}
          icon="briefcase"
        />
        <AppFab
          icon="plus"
          onPress={handleAddPress}
          accessibilityLabel={t('suppliers.add')}
          bottomInset={insets.bottom}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LoadingOverlay visible={loading} />
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.heroTitle}>
          {t('suppliers.title', { defaultValue: 'Suppliers' })}
        </Text>
        <Searchbar
          placeholder={rtlPlaceholder(t('search.placeholderSuppliers'))}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={rtlInputStyle}
        />
      </View>
      <FlatList
        data={filteredSuppliers}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <EmptyState message={t('empty.noSupplierSearchResults')} icon="search" />
        }
        renderItem={({ item }) => {
          const hasContact =
            !!(item.phone?.trim() || item.email?.trim());
          return (
            <View
              style={[
                styles.row,
                {
                  backgroundColor: theme.colors.surface,
                  opacity: item.is_active ? 1 : 0.6,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSupplierPress(item.id)}
                style={styles.rowMain}
              >
                <View style={styles.rowContent}>
                  <Text variant="titleMedium" numberOfLines={1}>
                    {item.name}
                  </Text>
                  {!item.is_active && (
                    <Text
                      variant="bodySmall"
                      style={[styles.inactiveBadge, { color: theme.colors.error }]}
                    >
                      {t('suppliers.inactive', { defaultValue: 'Inactive' })}
                    </Text>
                  )}
                </View>
                {item.phone ? (
                  <Text variant="bodySmall" style={styles.secondary}>
                    {item.phone}
                  </Text>
                ) : null}
                {item.email ? (
                  <Text variant="bodySmall" style={styles.secondary} numberOfLines={1}>
                    {item.email}
                  </Text>
                ) : null}
                {item.category_ids && item.category_ids.length > 0 ? (
                  <Text
                    variant="bodySmall"
                    style={styles.categories}
                    numberOfLines={2}
                  >
                    {getCategoryNames(item)}
                  </Text>
                ) : null}
              </TouchableOpacity>
              {hasContact ? (
                <ContactActionsRow
                  phone={item.phone}
                  email={item.email}
                  variant="compact"
                  contentAlign="flex-end"
                  style={styles.rowActions}
                />
              ) : null}
            </View>
          );
        }}
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
      />
      <AppFab
        icon="plus"
        onPress={handleAddPress}
        accessibilityLabel={t('suppliers.add')}
        bottomInset={insets.bottom}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  heroTitle: {
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontSize: 28,
  },
  searchbar: {
    minHeight: 40,
    marginBottom: spacing.sm,
    borderRadius: 10,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
  },
  rowActions: {
    marginStart: spacing.sm,
    paddingTop: 2,
    alignSelf: 'center',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inactiveBadge: {
    marginTop: 2,
  },
  secondary: {
    marginTop: 4,
    opacity: 0.8,
  },
  categories: {
    marginTop: 4,
    opacity: 0.7,
  },
});
