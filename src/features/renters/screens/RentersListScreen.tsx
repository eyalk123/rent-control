import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Checkbox, FAB, IconButton, Searchbar, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  usePropertyContext,
  useRenterContext,
  useRtlInputStyle,
  useRtlPlaceholder,
} from '@/src/context';
import { getLeaseEndDate } from '@/src/shared/types';
import {
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
} from '@/src/shared/components/ui';
import { RenterCard } from '@/src/features/renters/components/RenterCard';
import { deleteRenter } from '@/src/features/renters/api/renters';
import { spacing } from '@/src/core/theme';

export function RentersListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { renters, loading, error, refreshRenters } = useRenterContext();
  const { properties } = usePropertyContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setIsSelectMode(false);
        setSelectedIds(new Set());
      };
    }, [])
  );

  const propertyOwnerLowerById = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of properties) {
      const o = (p.property_owner ?? '').trim();
      if (o) m.set(p.id, o.toLowerCase());
    }
    return m;
  }, [properties]);

  const filteredRenters = useMemo(() => {
    let list = renters;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((renter) => {
        const fullName = `${renter.first_name} ${renter.last_name}`.toLowerCase();
        const address = (renter.property?.address ?? '').toLowerCase();
        const propertyOwner =
          renter.property_id != null
            ? (propertyOwnerLowerById.get(renter.property_id) ?? '')
            : '';
        return (
          fullName.includes(q) || address.includes(q) || propertyOwner.includes(q)
        );
      });
    }
    list = [...list].sort((a, b) => {
      const da = getLeaseEndDate(a);
      const db = getLeaseEndDate(b);
      if (da == null && db == null) return 0;
      if (da == null) return 1;
      if (db == null) return -1;
      return da.getTime() - db.getTime();
    });
    return list;
  }, [renters, searchQuery, propertyOwnerLowerById]);

  const allSelected = filteredRenters.length > 0 && filteredRenters.every((r) => selectedIds.has(r.id));
  const someSelected = !allSelected && filteredRenters.some((r) => selectedIds.has(r.id));

  const handleRenterPress = (id: number) => {
    if (isSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      return;
    }
    router.push(`/renters/${id}` as any);
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
      setSelectedIds(new Set(filteredRenters.map((r) => r.id)));
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
              Alert.alert(t('bulkDelete.partialError', { success, failed }));
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

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshRenters();
    setRefreshing(false);
  };

  if (loading && renters.length === 0) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error && renters.length === 0) {
    return (
      <ScreenContainer>
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
      <ScreenContainer>
        <EmptyState message={t('empty.noRenters')} icon="account" />
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom }]}
          onPress={handleAddPress}
          accessibilityLabel={t('renter.addRenter')}
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
            {t('screens.renters')}
          </Text>
        )}
        <Searchbar
          placeholder={rtlPlaceholder(t('search.placeholder'))}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={rtlInputStyle}
        />
      </View>
      <FlatList
        data={filteredRenters}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <EmptyState message={t('empty.noSearchResults')} icon="magnify" />
        }
        renderItem={({ item }) => (
          <RenterCard
            renter={item}
            onPress={() => handleRenterPress(item.id)}
            onLongPress={() => handleLongPress(item.id)}
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
          accessibilityLabel={t('renter.addRenter')}
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
  searchbar: {
    minHeight: 40,
    marginBottom: spacing.sm,
    borderRadius: 10,
  },
  list: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: spacing.sm,
    right: 0,
  },
});
