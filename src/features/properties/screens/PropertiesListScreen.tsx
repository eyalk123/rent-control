import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Checkbox, IconButton, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePropertyContext, useRenterContext, useRtlLabelStyle } from '@/src/context';
import {
  AppFab,
  AddOptionsDialog,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
  FilterChipsBar,
  FilterChip,
  FilterBottomSheet,
  FilterOption,
  ActiveFilterPills,
} from '@/src/shared/components/ui';
import { PropertyCard } from '@/src/features/properties/components/PropertyCard';
import { SettingsGearButton } from '@/src/shared/components/ui/SettingsGearButton';
import { deleteProperty } from '@/src/features/properties/api/properties';
import { spacing } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';

type ActiveSheet = 'property' | 'renter' | 'owner' | null;

export function PropertiesListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appAlert } = useAlert();
  const rtlLabelStyle = useRtlLabelStyle();
  const { properties, loading, error, refreshProperties } = usePropertyContext();
  const { renters } = useRenterContext();
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const [propertyFilter, setPropertyFilter] = useState<number | null>(null);
  const [renterFilter, setRenterFilter] = useState<number | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [addChooserOpen, setAddChooserOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsSelectMode(false);
        setSelectedIds(prev => prev.size > 0 ? new Set() : prev);
      };
    }, [])
  );

  const propertyOptions = useMemo<FilterOption[]>(
    () => properties.map((p) => ({ id: p.id, label: p.address })),
    [properties],
  );

  const renterOptions = useMemo<FilterOption[]>(
    () =>
      renters
        .filter((r) => r.property_id != null)
        .map((r) => ({ id: r.id, label: `${r.first_name} ${r.last_name}` })),
    [renters],
  );

  const ownerOptions = useMemo<FilterOption[]>(() => {
    const seen = new Set<string>();
    const opts: FilterOption[] = [];
    for (const p of properties) {
      const o = p.property_owner?.trim();
      if (o && !seen.has(o)) {
        seen.add(o);
        opts.push({ id: o, label: o });
      }
    }
    return opts;
  }, [properties]);

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (propertyFilter !== null && p.id !== propertyFilter) return false;
      if (renterFilter !== null && !p.renters?.some((r) => r.id === renterFilter)) return false;
      if (ownerFilter !== null && p.property_owner !== ownerFilter) return false;
      return true;
    });
  }, [properties, propertyFilter, renterFilter, ownerFilter]);

  const filterChips = useMemo<FilterChip[]>(
    () => [
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
    ],
    [t, propertyOptions, renterOptions, propertyFilter, renterFilter, ownerFilter],
  );

  const allSelected =
    filteredProperties.length > 0 && filteredProperties.every((p) => selectedIds.has(p.id));
  const someSelected = !allSelected && filteredProperties.some((p) => selectedIds.has(p.id));

  const handlePropertyPress = useCallback((id: number) => {
    if (isSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) { next.delete(id); } else { next.add(id); }
        return next;
      });
      return;
    }
    router.push(`/properties/${id}` as any);
  }, [isSelectMode, router]);

  const handleLongPress = useCallback((id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSelectMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProperties.map((p) => p.id)));
    }
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    appAlert(
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
                await deleteProperty(id);
                success++;
              } catch {
                failed++;
              }
            }
            await refreshProperties();
            setDeleting(false);
            setIsSelectMode(false);
            setSelectedIds(new Set());
            if (failed > 0) {
              appAlert(t('bulkDelete.partialError', { success, failed }));
            }
          },
        },
      ]
    );
  };

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/properties/add' as any);
  };

  const handleScanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/properties/scan' as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProperties();
    setRefreshing(false);
  };

  if (loading && properties.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error && properties.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <EmptyState
          message={error}
          icon="alert-circle"
          actionLabel={t('common.tryAgain')}
          onAction={refreshProperties}
        />
      </ScreenContainer>
    );
  }

  if (properties.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <EmptyState message={t('empty.noProperties')} icon="home" />
        <AppFab
          icon="plus"
          onPress={() => setAddChooserOpen(true)}
          accessibilityLabel={t('property.addProperty')}
          bottomInset={insets.bottom}
        />
        <AddOptionsDialog
          visible={addChooserOpen}
          title={t('property.addProperty')}
          onManual={() => { setAddChooserOpen(false); handleAddPress(); }}
          onScan={() => { setAddChooserOpen(false); handleScanPress(); }}
          onDismiss={() => setAddChooserOpen(false)}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
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
          <View style={styles.titleRow}>
            <Text variant="headlineLarge" style={[styles.screenTitle, rtlLabelStyle]}>
              {t('screens.properties')}
            </Text>
            <SettingsGearButton />
          </View>
        )}
        <FilterChipsBar chips={filterChips} stretch />
        <ActiveFilterPills chips={filterChips} />
      </View>
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={handlePropertyPress}
            onLongPress={handleLongPress}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(item.id)}
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
          <EmptyState message={t('empty.noPropertySearchResults')} icon="search" />
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
          onPress={() => setAddChooserOpen(true)}
          accessibilityLabel={t('property.addProperty')}
          bottomInset={insets.bottom}
        />
      )}
      <AddOptionsDialog
        visible={addChooserOpen}
        title={t('property.addProperty')}
        onManual={() => { setAddChooserOpen(false); handleAddPress(); }}
        onScan={() => { setAddChooserOpen(false); handleScanPress(); }}
        onDismiss={() => setAddChooserOpen(false)}
      />
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontWeight: '700',
    marginBottom: spacing.sm,
    fontSize: 28,
    flex: 1,
  },
  screenTitle: {
    fontWeight: '700',
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: 80,
  },
});
