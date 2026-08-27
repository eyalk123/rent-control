import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
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
import { RenterCard } from '@/src/features/renters/components/RenterCard';
import { SettingsGearButton } from '@/src/shared/components/ui/SettingsGearButton';
import { deleteRenter } from '@/src/features/renters/api/renters';
import { getEffectiveLeaseEnd, getRenterLifecycle } from '@/src/shared/utils/renterStatus';
import { spacing } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour } from '@/src/features/onboarding/TourController';

type ActiveSheet = 'property' | 'renter' | 'owner' | 'lifecycle' | null;

/** Which slice of the lifecycle the list is showing. Current is the default: past
 * tenants stay in the database forever, but they shouldn't crowd out the live ones. */
type LifecycleFilter = 'current' | 'ended' | 'all';

const LIST_ANCHOR = { flex: 1 } as const;

export function RentersListScreen() {
  useTour('renters-list');
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appAlert } = useAlert();
  const rtlLabelStyle = useRtlLabelStyle();
  const { renters, loading, error, refreshRenters } = useRenterContext();
  const { properties } = usePropertyContext();
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const [propertyFilter, setPropertyFilter] = useState<number | null>(null);
  const [renterFilter, setRenterFilter] = useState<number | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<string | null>(null);
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilter>('current');
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

  const ownerByPropertyId = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of properties) {
      const o = p.property_owner?.trim();
      if (o) m.set(p.id, o);
    }
    return m;
  }, [properties]);

  const propertyOptions = useMemo<FilterOption[]>(() => {
    const seen = new Set<number>();
    const opts: FilterOption[] = [];
    for (const r of renters) {
      if (r.property && !seen.has(r.property.id)) {
        seen.add(r.property.id);
        opts.push({ id: r.property.id, label: r.property.address });
      }
    }
    return opts;
  }, [renters]);

  const renterOptions = useMemo<FilterOption[]>(
    () => renters.map((r) => ({ id: r.id, label: `${r.first_name} ${r.last_name}` })),
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

  const filteredRenters = useMemo(() => {
    let list = renters.filter((renter) => {
      const ended = getRenterLifecycle(renter) === 'ended';
      if (lifecycleFilter === 'current' && ended) return false;
      if (lifecycleFilter === 'ended' && !ended) return false;
      if (propertyFilter !== null && renter.property_id !== propertyFilter) return false;
      if (renterFilter !== null && renter.id !== renterFilter) return false;
      if (ownerFilter !== null) {
        const owner =
          renter.property_id != null ? ownerByPropertyId.get(renter.property_id) : undefined;
        if (owner !== ownerFilter) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      const da = getEffectiveLeaseEnd(a);
      const db = getEffectiveLeaseEnd(b);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da.getTime() - db.getTime();
    });
    return list;
  }, [renters, lifecycleFilter, propertyFilter, renterFilter, ownerFilter, ownerByPropertyId]);

  const lifecycleOptions = useMemo(
    () => [
      { id: 'current', label: t('renter.filterCurrent') },
      { id: 'ended', label: t('renter.filterEnded') },
      { id: 'all', label: t('renter.filterAllLeases') },
    ],
    [t],
  );

  const filterChips = useMemo<FilterChip[]>(
    () => [
      {
        key: 'lifecycle',
        label: t('renter.filterLease'),
        // Only shown as an active pill when it differs from the default, so the common
        // case doesn't carry a pill that says "the usual".
        selectedLabel:
          lifecycleFilter === 'current'
            ? null
            : (lifecycleOptions.find((o) => o.id === lifecycleFilter)?.label ?? null),
        onPress: () => setActiveSheet('lifecycle'),
        onClear: () => setLifecycleFilter('current'),
      },
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
    [t, propertyOptions, renterOptions, lifecycleOptions, propertyFilter, renterFilter, ownerFilter, lifecycleFilter],
  );

  const allSelected =
    filteredRenters.length > 0 && filteredRenters.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && filteredRenters.some((r) => selectedIds.has(r.id));

  const handleRenterPress = useCallback((id: number) => {
    if (isSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) { next.delete(id); } else { next.add(id); }
        return next;
      });
      return;
    }
    router.push(`/renters/${id}` as any);
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
      setSelectedIds(new Set(filteredRenters.map((r) => r.id)));
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
                await deleteRenter(id);
                success++;
              } catch {
                failed++;
              }
            }
            await refreshRenters();
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
    router.push('/renters/add' as any);
  };

  const handleScanPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/renters/scan' as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshRenters();
    setRefreshing(false);
  };

  if (loading && renters.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error && renters.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <EmptyState
          message={error}
          icon="alert-circle"
          actionLabel={t('common.tryAgain')}
          onAction={refreshRenters}
        />
      </ScreenContainer>
    );
  }

  if (renters.length === 0) {
    return (
      <ScreenContainer edges={['top', 'left', 'right']}>
        <EmptyState message={t('empty.noRenters')} icon="user" />
        <AppFab
          icon="plus"
          anchor={ANCHORS.rentersAddButton}
          onPress={() => setAddChooserOpen(true)}
          accessibilityLabel={t('renter.addRenter')}
          bottomInset={insets.bottom}
        />
        <AddOptionsDialog
          visible={addChooserOpen}
          title={t('renter.addRenter')}
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
              {t('screens.renters')}
            </Text>
            <SettingsGearButton />
          </View>
        )}
        {/* The lease filter is the seed target: 'Ended' is where a departed tenant's
            history lives, which is not guessable from the chip alone. */}
        <TourAnchor id={ANCHORS.rentersEndedFilter}>
          <FilterChipsBar chips={filterChips} stretch />
        </TourAnchor>
        <ActiveFilterPills chips={filterChips} />
      </View>
      <TourAnchor id={ANCHORS.rentersList} style={LIST_ANCHOR}>
      <FlatList
        data={filteredRenters}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <EmptyState message={t('empty.noSearchResults')} icon="search" />
        }
        renderItem={({ item }) => (
          <RenterCard
            renter={item}
            onPress={handleRenterPress}
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
      />
      </TourAnchor>
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
          anchor={ANCHORS.rentersAddButton}
          onPress={() => setAddChooserOpen(true)}
          accessibilityLabel={t('renter.addRenter')}
          bottomInset={insets.bottom}
        />
      )}
      <AddOptionsDialog
        visible={addChooserOpen}
        title={t('renter.addRenter')}
        onManual={() => { setAddChooserOpen(false); handleAddPress(); }}
        onScan={() => { setAddChooserOpen(false); handleScanPress(); }}
        onDismiss={() => setAddChooserOpen(false)}
      />
      <FilterBottomSheet
        visible={activeSheet === 'lifecycle'}
        onDismiss={() => setActiveSheet(null)}
        title={t('renter.filterLease')}
        options={lifecycleOptions}
        selectedId={lifecycleFilter}
        onSelect={(id) => setLifecycleFilter((id as LifecycleFilter | null) ?? 'current')}
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
