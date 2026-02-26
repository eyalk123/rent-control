import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { usePropertyContext } from '@/src/context';
import { PropertyCard, LoadingOverlay, EmptyState } from '@/src/components';

export function PropertiesListScreen() {
  const router = useRouter();
  const { properties, loading, error } = usePropertyContext();

  const handlePropertyPress = (id: number) => {
    router.push(`/(tabs)/properties/${id}` as any);
  };

  const handleAddPress = () => {
    router.push('/(tabs)/properties/add' as any);
  };

  if (loading && properties.length === 0) {
    return <LoadingOverlay visible={true} />;
  }

  if (error && properties.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState message={error} icon="alert-circle" />
      </View>
    );
  }

  if (properties.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState message="No properties yet. Tap + to add one." icon="home" />
        <FAB icon="plus" style={styles.fab} onPress={handleAddPress} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />
      <FlatList
        data={properties}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => handlePropertyPress(item.id)}
          />
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
