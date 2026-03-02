import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { FAB, Searchbar, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePropertyContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import {
  PropertyCard,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
} from '@/src/components';
import { spacing } from '@/src/theme';

type PropertyFilter = 'all' | 'residential' | 'commercial';

const RESIDENTIAL_TYPES = ['apartment', 'house'];

export function PropertiesListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const rtlInputStyle = useRtlInputStyle();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { properties, loading, error, refreshProperties } = usePropertyContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<PropertyFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filteredProperties = useMemo(() => {
    let list = properties;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.address.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.zip_code.toLowerCase().includes(q)
      );
    }
    if (filter === 'residential') {
      list = list.filter((p) => RESIDENTIAL_TYPES.includes(p.type));
    } else if (filter === 'commercial') {
      list = list.filter((p) => p.type === 'commercial');
    }
    return list;
  }, [properties, searchQuery, filter]);

  const handlePropertyPress = (id: number) => {
    router.push(`/(tabs)/properties/${id}` as any);
  };

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/properties/add' as any);
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
        <EmptyState message={error} icon="alert-circle" />
      </ScreenContainer>
    );
  }

  if (properties.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState message={t('empty.noProperties')} icon="home" />
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
          onPress={handleAddPress}
          accessibilityLabel={t('property.addProperty')}
          accessibilityRole="button"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <LoadingOverlay visible={loading} />
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.heroTitle}>
          {t('screens.properties')}
        </Text>
        <Searchbar
          placeholder={useRtlPlaceholder(t('search.placeholderProperties'))}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={rtlInputStyle}
        />
        <SegmentedButtons
          value={filter}
          onValueChange={(v) => setFilter(v as PropertyFilter)}
          buttons={[
            { value: 'all', label: t('filters.all') },
            { value: 'residential', label: t('filters.residential') },
            { value: 'commercial', label: t('filters.commercial') },
          ]}
          style={styles.filters}
        />
      </View>
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => handlePropertyPress(item.id)}
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
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={handleAddPress}
        accessibilityLabel={t('property.addProperty')}
        accessibilityRole="button"
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
  filters: {
    marginBottom: spacing.md,
  },
  list: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    end: 0,
  },
});
