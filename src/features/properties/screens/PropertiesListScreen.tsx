import React, { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { FAB, Searchbar, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePropertyContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import {
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
} from '@/src/shared/components/ui';
import { PropertyCard } from '@/src/features/properties/components/PropertyCard';
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

  const handlePropertyPress = (id: number) => {
    router.push(`/properties/${id}` as any);
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
      <LoadingOverlay visible={loading} />
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.heroTitle}>
          {t('screens.properties')}
        </Text>
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
        style={[styles.fab, { bottom: insets.bottom }]}
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
  list: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: spacing.sm,
    right: 0,
  },
});
