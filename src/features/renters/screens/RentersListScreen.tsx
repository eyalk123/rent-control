import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { FAB, Searchbar, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRenterContext, useRtlInputStyle, useRtlPlaceholder } from '@/src/context';
import {
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
} from '@/src/shared/components/ui';
import { RenterCard } from '@/src/features/renters/components/RenterCard';
import { spacing } from '@/src/core/theme';

export function RentersListScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { renters, loading, error, refreshRenters } = useRenterContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const filteredRenters = useMemo(() => {
    let list = renters;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((renter) => {
        const fullName = `${renter.first_name} ${renter.last_name}`.toLowerCase();
        const address = (renter.property?.address ?? '').toLowerCase();
        return fullName.includes(q) || address.includes(q);
      });
    }
    return list;
  }, [renters, searchQuery]);

  const handleRenterPress = (id: number) => {
    router.push(`/renters/${id}` as any);
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
          style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
          onPress={handleAddPress}
          accessibilityLabel={t('renter.addRenter')}
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
          {t('screens.renters')}
        </Text>
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
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={handleAddPress}
        accessibilityLabel={t('renter.addRenter')}
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
    margin: spacing.lg,
    end: 0,
  },
});
