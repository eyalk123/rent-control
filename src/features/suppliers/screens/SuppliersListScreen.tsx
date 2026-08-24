import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppFab,
  ContactActionsRow,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
  FilterChipsBar,
  FilterChip,
  FilterBottomSheet,
  FilterOption,
  ActiveFilterPills,
} from '@/src/shared/components/ui';
import { useSuppliersList } from '@/src/features/suppliers/hooks/useSuppliersList';
import { useExpenseCategories } from '@/src/features/transactions/hooks/useTransactions';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour } from '@/src/features/onboarding/TourController';
import { updateSupplier } from '@/src/features/suppliers/api/suppliers';
import { SupplierDetailModal } from '@/src/features/suppliers/components/SupplierDetailModal';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useAlert } from '@/src/core/context';
import type { Supplier } from '@/src/shared/types';
import { spacing } from '@/src/core/theme';

type ActiveSheet = 'name' | 'category' | null;

export function SuppliersListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appAlert } = useAlert();
  const {
    suppliers,
    loading,
    error,
    refreshSuppliers,
    retryLoad,
  } = useSuppliersList();
  const { categories } = useExpenseCategories();
  // Destination of the Suppliers seed planted on the first-run tour.
  useTour('suppliers');
  const [refreshing, setRefreshing] = useState(false);

  const [nameFilter, setNameFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshSuppliers();
    }, [refreshSuppliers]),
  );

  const nameOptions = useMemo<FilterOption[]>(
    () => suppliers.map((s) => ({ id: s.id, label: s.name })),
    [suppliers],
  );

  const categoryOptions = useMemo<FilterOption[]>(() => {
    const seen = new Set<number>();
    const opts: FilterOption[] = [];
    for (const s of suppliers) {
      for (const id of s.category_ids ?? []) {
        if (seen.has(id)) continue;
        const cat = categories.find((c) => c.id === id);
        if (!cat) continue;
        seen.add(id);
        opts.push({ id, label: getCategoryDisplayName(cat, t) });
      }
    }
    return opts;
  }, [suppliers, categories, t]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      if (nameFilter !== null && supplier.id !== nameFilter) return false;
      if (
        categoryFilter !== null &&
        !(supplier.category_ids ?? []).includes(categoryFilter)
      ) {
        return false;
      }
      return true;
    });
  }, [suppliers, nameFilter, categoryFilter]);

  const filterChips = useMemo<FilterChip[]>(
    () => [
      {
        key: 'name',
        label: t('filters.name', { defaultValue: 'Name' }),
        selectedLabel: nameOptions.find((o) => o.id === nameFilter)?.label ?? null,
        onPress: () => setActiveSheet('name'),
        onClear: () => setNameFilter(null),
      },
      {
        key: 'category',
        label: t('filters.category', { defaultValue: 'Category' }),
        selectedLabel:
          categoryOptions.find((o) => o.id === categoryFilter)?.label ?? null,
        onPress: () => setActiveSheet('category'),
        onClear: () => setCategoryFilter(null),
      },
    ],
    [t, nameOptions, categoryOptions, nameFilter, categoryFilter],
  );

  const handleSupplierPress = (supplier: Supplier) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSupplier(supplier);
  };

  const handleEditSupplier = (id: number) => {
    setSelectedSupplier(null);
    router.push(`/transactions/suppliers/${id}` as any);
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    appAlert(
      t('suppliers.deleteConfirmTitle', { defaultValue: 'Delete supplier?' }),
      t('suppliers.deleteConfirmMessage', {
        defaultValue:
          'This will deactivate the supplier. You can reactivate it later by editing.',
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('suppliers.delete', { defaultValue: 'Delete Supplier' }),
          style: 'destructive',
          onPress: async () => {
            try {
              await updateSupplier(supplier.id, { is_active: false });
              await refreshSuppliers();
              setSelectedSupplier(null);
            } catch (err) {
              appAlert(
                t('error.title'),
                getApiErrorMessage(err, t('error.deleteSupplierFailed')),
              );
            }
          },
        },
      ],
    );
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
        {/* Categories are reachable from here, which is what the tour's second step
            points at — they are also what expense reports group by. */}
        <TourAnchor id={ANCHORS.suppliersCategories}>
          <FilterChipsBar chips={filterChips} stretch />
        </TourAnchor>
        <ActiveFilterPills chips={filterChips} />
      </View>
      <TourAnchor id={ANCHORS.suppliersList} style={styles.listAnchor}>
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
                onPress={() => handleSupplierPress(item)}
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
      </TourAnchor>
      <AppFab
        icon="plus"
        onPress={handleAddPress}
        accessibilityLabel={t('suppliers.add')}
        bottomInset={insets.bottom}
      />
      <FilterBottomSheet
        visible={activeSheet === 'name'}
        onDismiss={() => setActiveSheet(null)}
        title={t('filters.name', { defaultValue: 'Name' })}
        options={nameOptions}
        selectedId={nameFilter}
        onSelect={(id) => setNameFilter(id as number | null)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'category'}
        onDismiss={() => setActiveSheet(null)}
        title={t('filters.category', { defaultValue: 'Category' })}
        options={categoryOptions}
        selectedId={categoryFilter}
        onSelect={(id) => setCategoryFilter(id as number | null)}
      />
      <SupplierDetailModal
        visible={selectedSupplier !== null}
        supplier={selectedSupplier}
        categoryNames={selectedSupplier ? getCategoryNames(selectedSupplier) : ''}
        onDismiss={() => setSelectedSupplier(null)}
        onEdit={handleEditSupplier}
        onDelete={handleDeleteSupplier}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listAnchor: { flex: 1 },
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
