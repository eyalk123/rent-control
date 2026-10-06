import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguageContext, usePropertyContext } from '@/src/context';
import {
  AppFab,
  ContactActionsRow,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
  FilterBar,
  FilterChip,
  FilterBottomSheet,
  FilterOption,
} from '@/src/shared/components/ui';
import { usePropertyOwnersList } from '@/src/features/property-owners/hooks/usePropertyOwnersList';
import { deletePropertyOwner, isPropertyOwnerConflict, propertyCountLabel } from '@/src/features/property-owners/api/propertyOwners';
import { PropertyOwnerDetailModal } from '@/src/features/property-owners/components/PropertyOwnerDetailModal';
import { getApiErrorMessage } from '@/src/core/api/client';
import { useAlert } from '@/src/core/context';
import type { PropertyOwner } from '@/src/shared/types';
import { spacing } from '@/src/core/theme';

/** The people who own the properties — the Suppliers list's layout, reached from the
 *  Properties tab. */
export function PropertyOwnersListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isRtl } = useLanguageContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appAlert } = useAlert();
  const { owners, loading, error, refreshOwners, retryLoad } = usePropertyOwnersList();
  // A rename or delete here shows on the property cards, which read the owner's name.
  const { refreshProperties } = usePropertyContext();
  const [refreshing, setRefreshing] = useState(false);
  const [nameFilter, setNameFilter] = useState<number | null>(null);
  const [nameSheetOpen, setNameSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Read from the list rather than held as a copy, so an edit shows when the sheet reopens.
  const selectedOwner = owners.find((o) => o.id === selectedId) ?? null;

  useFocusEffect(
    useCallback(() => {
      refreshOwners();
    }, [refreshOwners]),
  );

  const nameOptions = useMemo<FilterOption[]>(
    () => owners.map((o) => ({ id: o.id, label: o.name })),
    [owners],
  );

  const filteredOwners = useMemo(
    () => (nameFilter === null ? owners : owners.filter((o) => o.id === nameFilter)),
    [owners, nameFilter],
  );

  const filterChips = useMemo<FilterChip[]>(
    () => [
      {
        key: 'name',
        label: t('filters.name', { defaultValue: 'Name' }),
        selectedLabel: nameOptions.find((o) => o.id === nameFilter)?.label ?? null,
        onPress: () => setNameSheetOpen(true),
        onClear: () => setNameFilter(null),
      },
    ],
    [t, nameOptions, nameFilter],
  );

  const handleOwnerPress = (owner: PropertyOwner) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedId(owner.id);
  };

  const handleEditOwner = (id: number) => {
    setSelectedId(null);
    router.push(`/properties/owners/${id}` as any);
  };

  const handleDeleteOwner = (owner: PropertyOwner) => {
    appAlert(t('propertyOwners.deleteConfirm'), t('propertyOwners.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('propertyOwners.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePropertyOwner(owner.id);
            setSelectedId(null);
            if (nameFilter === owner.id) setNameFilter(null);
            await refreshOwners();
          } catch (err) {
            appAlert(
              t('error.title'),
              // A property was given to them since the list loaded.
              isPropertyOwnerConflict(err)
                ? t('propertyOwners.deleteBlocked')
                : getApiErrorMessage(err, t('propertyOwners.deleteFailed')),
            );
          }
        },
      },
    ]);
  };

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/properties/owners/add' as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshOwners(), refreshProperties()]);
    setRefreshing(false);
  };

  const titleRow = (
    <View style={styles.titleRow}>
      <IconButton
        icon={isRtl ? 'chevron-right' : 'chevron-left'}
        accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
        onPress={() => router.back()}
        style={styles.backButton}
      />
      <Text variant="headlineLarge" style={styles.heroTitle}>
        {t('propertyOwners.title')}
      </Text>
    </View>
  );

  if (loading && owners.length === 0) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error && owners.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.header}>{titleRow}</View>
        <EmptyState
          message={error}
          icon="alert-circle"
          actionLabel={t('common.tryAgain')}
          onAction={retryLoad}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        {titleRow}
        {owners.length > 0 ? <FilterBar chips={filterChips} /> : null}
      </View>
      <FlatList
        data={filteredOwners}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <EmptyState message={t('propertyOwners.empty')} icon="user" />
        }
        renderItem={({ item }) => {
          const hasContact = !!(item.phone?.trim() || item.email?.trim());
          return (
            <View
              style={[
                styles.row,
                { backgroundColor: theme.colors.surface, opacity: item.is_active ? 1 : 0.6 },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOwnerPress(item)}
                style={styles.rowMain}
              >
                <View style={styles.rowContent}>
                  <Text variant="titleMedium" numberOfLines={1} style={styles.rowName}>
                    {item.name}
                  </Text>
                  {!item.is_active && (
                    <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                      {t('suppliers.inactive')}
                    </Text>
                  )}
                </View>
                <Text variant="bodySmall" style={styles.secondary}>
                  {propertyCountLabel(t, item.property_count)}
                </Text>
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
        contentContainerStyle={[styles.list, { paddingBottom: 80 + insets.bottom }]}
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
        accessibilityLabel={t('propertyOwners.add')}
        bottomInset={insets.bottom}
      />
      <FilterBottomSheet
        visible={nameSheetOpen}
        onDismiss={() => setNameSheetOpen(false)}
        title={t('filters.name', { defaultValue: 'Name' })}
        options={nameOptions}
        selectedId={nameFilter}
        onSelect={(id) => setNameFilter(id as number | null)}
      />
      <PropertyOwnerDetailModal
        visible={selectedOwner !== null}
        owner={selectedOwner}
        onDismiss={() => setSelectedId(null)}
        onEdit={handleEditOwner}
        onDelete={handleDeleteOwner}
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
  rowName: {
    flexShrink: 1,
  },
  secondary: {
    marginTop: 4,
    opacity: 0.8,
  },
});
