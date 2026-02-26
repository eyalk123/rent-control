import React, { useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { FAB, Searchbar, List } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useRenterContext } from '@/src/context';
import { LoadingOverlay, EmptyState } from '@/src/components';

export function RentersListScreen() {
  const router = useRouter();
  const { renters, loading, error } = useRenterContext();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRenters = useMemo(() => {
    if (!searchQuery.trim()) return renters;
    const q = searchQuery.toLowerCase().trim();
    return renters.filter((renter) => {
      const fullName = `${renter.first_name} ${renter.last_name}`.toLowerCase();
      const address = (renter.property?.address ?? '').toLowerCase();
      return fullName.includes(q) || address.includes(q);
    });
  }, [renters, searchQuery]);

  const handleRenterPress = (id: number) => {
    router.push(`/(tabs)/renters/${id}` as any);
  };

  const handleAddPress = () => {
    router.push('/(tabs)/renters/add' as any);
  };

  if (loading && renters.length === 0) {
    return <LoadingOverlay visible={true} />;
  }

  if (error && renters.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState message={error} icon="alert-circle" />
      </View>
    );
  }

  if (renters.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState message="No renters yet. Tap + to add one." icon="account" />
        <FAB icon="plus" style={styles.fab} onPress={handleAddPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />
      <Searchbar
        placeholder="Search by name or property address"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={filteredRenters}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <EmptyState message="No renters match your search." icon="magnify" />
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleRenterPress(item.id)}>
            <List.Item
              title={`${item.first_name} ${item.last_name}`}
              description={item.property?.address ?? 'Unassigned'}
              left={(props) => <List.Icon {...props} icon="account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
      <FAB icon="plus" style={styles.fab} onPress={handleAddPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  list: {
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
