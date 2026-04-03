import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Checkbox, FAB, IconButton, Searchbar, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePropertyContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import {
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
} from '@/src/shared/components/ui';
import { PropertyCard } from '@/src/features/properties/components/PropertyCard';
import { deleteProperty } from '@/src/features/properties/api/properties';
import { spacing } from '@/src/core/theme';

export function PropertiesListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const rtlInputStyle = useRtlInputStyle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { properties, loading, error, refreshProperties } = usePropertyContext();
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

  const filteredProperties = useMemo(() => {
    let list = properties;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.address.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.zip_code.toLowerCase().includes(q) ||
          (p.property_owner ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [properties, searchQuery]);

  const rtlPlaceholder = useRtlPlaceholder();
  const searchPlaceholder = rtlPlaceholder(t('search.placeholderProperties'));

  const allSelected = filteredProperties.length > 0 && filteredProperties.every((p) => selectedIds.has(p.id));
  const someSelected = !allSelected && filteredProperties.some((p) => selectedIds.has(p.id));

  const handlePropertyPress = (id: number) => {
    if (isSelectMode) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      return;
    }
    router.push(`/properties/${id}` as any);
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
      setSelectedIds(new Set(filteredProperties.map((p) => p.id)));
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
              Alert.alert(t('bulkDelete.partialError', { success, failed }));
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

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProperties();
    setRefreshing(false);
  };

  if (loading && properties.length === 0) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error && properties.length === 0) {
    return (
      <ScreenContainer>
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
      <ScreenContainer>
        <EmptyState message={t('empty.noProperties')} icon="home" />
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom }]}
          onPress={handleAddPress}
          accessibilityLabel={t('property.addProperty')}
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
            {t('screens.properties')}
          </Text>
        )}
        <Searchbar
          placeholder={searchPlaceholder}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={rtlInputStyle}
        />
      </View>
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => handlePropertyPress(item.id)}
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
        ListEmptyComponent={
          <EmptyState message={t('empty.noPropertySearchResults')} icon="magnify" />
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
          accessibilityLabel={t('property.addProperty')}
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
