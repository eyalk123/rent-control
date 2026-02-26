import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPropertyById } from '@/src/api/properties';
import type { Property } from '@/src/types';
import { LoadingOverlay } from '@/src/components';

export function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProperty() {
      const numericId = Number(id);
      if (isNaN(numericId)) {
        setError('Invalid property ID');
        setLoading(false);
        return;
      }
      try {
        const data = await getPropertyById(numericId);
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  const handleEdit = () => {
    if (property) {
      router.push(`/(tabs)/properties/edit/${property.id}` as any);
    }
  };

  if (loading) {
    return <LoadingOverlay visible={true} />;
  }

  if (error || !property) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge">{error ?? 'Property not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {property.image_url ? (
        <Image
          source={{ uri: property.image_url }}
          style={[styles.image, { width: width - 32 }]}
          resizeMode="cover"
        />
      ) : null}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.address}>
            {property.address}
          </Text>
          <Text variant="bodyLarge">
            {property.city}, {property.zip_code}
          </Text>
          <Text variant="bodyMedium" style={styles.detail}>
            Type: {property.type}
          </Text>
          <Text variant="bodyMedium" style={styles.detail}>
            Sq Ft: {property.sq_ft.toLocaleString()}
          </Text>
          <Text variant="bodyMedium" style={styles.detail}>
            Purchase Price: ${property.purchase_price.toLocaleString()}
          </Text>
        </Card.Content>
      </Card>

      {property.renters && property.renters.length > 0 ? (
        <Card style={styles.card}>
          <Card.Title title="Renters" />
          <Card.Content>
            {property.renters.map((renter) => (
              <View key={renter.id} style={styles.renterRow}>
                <Text variant="bodyMedium">
                  {renter.first_name} {renter.last_name}
                </Text>
                <Text variant="bodySmall" style={styles.leaseDates}>
                  Lease: {renter.lease_start} – {renter.lease_end}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="bodyMedium" style={styles.vacant}>
              No renters assigned
            </Text>
          </Card.Content>
        </Card>
      )}

      <Button mode="contained" onPress={handleEdit} style={styles.editButton}>
        Edit Property
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  image: {
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'center',
  },
  card: {
    marginBottom: 16,
  },
  address: {
    marginBottom: 8,
  },
  detail: {
    marginTop: 4,
  },
  renterRow: {
    marginBottom: 12,
  },
  leaseDates: {
    color: '#666',
    marginTop: 2,
  },
  vacant: {
    color: '#666',
  },
  editButton: {
    marginTop: 8,
  },
});
