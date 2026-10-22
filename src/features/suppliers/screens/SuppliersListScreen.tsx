import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useLanguageContext } from '@/src/context';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppFab,
  ContactActionsRow,
  InitialsTile,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
  FilterBar,
  FilterChip,
  FilterBottomSheet,
  FilterOption,
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
import { useAlert, useOnReconnect } from '@/src/core/context';
import type { ExpenseCategory, Supplier } from '@/src/shared/types';
import { cardShadow, darkColors, lightColors, radii, spacing, useEntityColor } from '@/src/core/theme';
import { CategoryTag } from '@/src/features/transactions/components/shared/CategoryTag';
import { supplierColorKey } from '@/src/features/suppliers/utils/supplierColor';
import { categoryFilterOption, supplierFilterOption } from '@/src/shared/utils/filterOptions';

type ActiveSheet = 'name' | 'category' | null;

/**
 * One supplier: initials on its color (its first category's), how to reach it, its
 * categories as colored chips, and call / message / email at the end.
 */
function SupplierRow({
  supplier,
  categories,
  onPress,
}: {
  supplier: Supplier;
  categories: ExpenseCategory[];
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const itemColor = useEntityColor(supplierColorKey(supplier, categories));
  const contactLine = [supplier.phone?.trim(), supplier.email?.trim()].filter(Boolean).join(' · ');
  const supplierCategories = (supplier.category_ids ?? [])
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is ExpenseCategory => !!c);
  const hasContact = !!(supplier.phone?.trim() || supplier.email?.trim());

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.colors.surface, opacity: supplier.is_active ? 1 : 0.6 },
      ]}
    >
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.rowMain}>
        <InitialsTile
          name={supplier.name}
          size={44}
          radius={13}
          backgroundColor={itemColor.bg}
          textColor={itemColor.fg}
        />
        <View style={styles.rowText}>
          <View style={styles.rowContent}>
            <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
              {supplier.name}
            </Text>
            {!supplier.is_active && (
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {t('suppliers.inactive', { defaultValue: 'Inactive' })}
              </Text>
            )}
          </View>
          {contactLine ? (
            <Text variant="bodySmall" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {contactLine}
            </Text>
          ) : null}
          {supplierCategories.length > 0 ? (
            <View style={styles.tags}>
              {supplierCategories.map((cat) => (
                <CategoryTag key={cat.id} label={getCategoryDisplayName(cat, t)} color={cat.color} />
              ))}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
      {hasContact ? (
        <ContactActionsRow
          phone={supplier.phone}
          email={supplier.email}
          variant="compact"
          raised
          contentAlign="flex-end"
          style={styles.rowActions}
        />
      ) : null}
    </View>
  );
}

export function SuppliersListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isRtl } = useLanguageContext();
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
  useOnReconnect(() => refreshSuppliers());

  const nameOptions = useMemo<FilterOption[]>(
    () => suppliers.map((s) => supplierFilterOption(s.id, s.name, supplierColorKey(s, categories))),
    [suppliers, categories],
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
        opts.push(categoryFilterOption(id, getCategoryDisplayName(cat, t), cat.color));
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

  const hasActiveFilters = filterChips.some((c) => c.selectedLabel !== null);

  const clearAllFilters = useCallback(() => {
    setNameFilter(null);
    setCategoryFilter(null);
  }, []);

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
        {/* This screen is pushed from the Transactions tab, and until now the only way out
            was the system back gesture - it was the one screen in the app with no visible
            back control. Same row shape Settings uses for a pushed screen with a big title. */}
        <View style={styles.titleRow}>
          <IconButton
            icon={isRtl ? 'chevron-right' : 'chevron-left'}
            accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Text variant="headlineLarge" style={styles.heroTitle}>
            {t('suppliers.title', { defaultValue: 'Suppliers' })}
          </Text>
        </View>
        {/* Categories are reachable from here, which is what the tour's second step
            points at — they are also what expense reports group by. */}
        <TourAnchor id={ANCHORS.suppliersCategories}>
          <FilterBar chips={filterChips} />
        </TourAnchor>
      </View>
      <TourAnchor id={ANCHORS.suppliersList} style={styles.listAnchor}>
      <FlatList
        data={filteredSuppliers}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <EmptyState
            message={t('empty.noSupplierSearchResults')}
            icon="search"
            actionLabel={hasActiveFilters ? t('empty.clearFilters') : undefined}
            onAction={hasActiveFilters ? clearAllFilters : undefined}
          />
        }
        renderItem={({ item }) => (
          <SupplierRow
            supplier={item}
            categories={categories}
            onPress={() => handleSupplierPress(item)}
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
        categories={categories}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    margin: 0,
    marginLeft: -spacing.sm,
  },
  heroTitle: {
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontSize: 28,
    flexShrink: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 80,
  },
  // Borderless with the list screens' shadow, like the renter and property rows.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm + 2,
    ...cardShadow,
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    flexShrink: 1,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
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
});
