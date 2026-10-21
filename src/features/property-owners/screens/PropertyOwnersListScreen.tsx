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
  ColorDot,
  ContactActionsRow,
  Icon,
  InitialsTile,
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
import { useAlert, useOnReconnect } from '@/src/core/context';
import type { PropertyOwner } from '@/src/shared/types';
import { cardShadow, darkColors, lightColors, radii, spacing, ICON_SM } from '@/src/core/theme';

/** The people who own the properties — the Suppliers list's layout, reached from the
 *  Properties tab. */
/**
 * One owner: initials on the neutral navy tint (owners have no color of their own), and their
 * properties' color dots beside the count - the color here always means a property.
 */
function OwnerRow({
  owner,
  propertyColors,
  onPress,
}: {
  owner: PropertyOwner;
  propertyColors: (string | null)[];
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const contactLine = [owner.phone?.trim(), owner.email?.trim()].filter(Boolean).join(' · ');
  const hasContact = !!(owner.phone?.trim() || owner.email?.trim());

  return (
    <View
      style={[styles.row, { backgroundColor: theme.colors.surface, opacity: owner.is_active ? 1 : 0.6 }]}
    >
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.rowMain}>
        <InitialsTile
          name={owner.name}
          size={44}
          radius={13}
          backgroundColor={colors.primaryBg}
          textColor={colors.primary}
        />
        <View style={styles.rowText}>
          <View style={styles.rowContent}>
            <Text variant="titleMedium" numberOfLines={1} style={styles.rowName}>
              {owner.name}
            </Text>
            {!owner.is_active && (
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {t('suppliers.inactive')}
              </Text>
            )}
          </View>
          <View style={styles.countRow}>
            {propertyColors.slice(0, 6).map((c, i) => (
              <ColorDot key={i} color={c} />
            ))}
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {propertyCountLabel(t, owner.property_count)}
            </Text>
          </View>
          {contactLine ? (
            <Text variant="bodySmall" style={{ color: colors.textSecondary }} numberOfLines={1}>
              {contactLine}
            </Text>
          ) : null}
        </View>
        {hasContact ? null : (
          <Icon name={isRtl ? 'chevron-left' : 'chevron-right'} size={ICON_SM} color={colors.textSecondary} />
        )}
      </TouchableOpacity>
      {hasContact ? (
        <ContactActionsRow
          phone={owner.phone}
          email={owner.email}
          variant="compact"
          raised
          contentAlign="flex-end"
          style={styles.rowActions}
        />
      ) : null}
    </View>
  );
}

export function PropertyOwnersListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isRtl } = useLanguageContext();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appAlert } = useAlert();
  const { owners, loading, error, refreshOwners, retryLoad } = usePropertyOwnersList();
  // A rename or delete here shows on the property cards, which read the owner's name.
  const { properties, refreshProperties } = usePropertyContext();
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
  useOnReconnect(() => refreshOwners());

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
        renderItem={({ item }) => (
          <OwnerRow
            owner={item}
            propertyColors={properties
              .filter((p) => p.property_owner_id === item.id)
              .map((p) => p.color ?? null)}
            onPress={() => handleOwnerPress(item)}
          />
        )}
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
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    fontWeight: '600',
  },
});
