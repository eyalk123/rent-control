import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import type { Property } from '@/src/types';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const isOccupied = (property.renters?.length ?? 0) > 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content>
          <Chip
            style={styles.chip}
            mode="flat"
            compact
            selected={isOccupied}
          >
            {isOccupied ? 'Occupied' : 'Vacant'}
          </Chip>
          <Text variant="titleMedium" style={styles.address}>
            {property.address}
          </Text>
          <Text variant="bodyMedium" style={styles.city}>
            {property.city}, {property.zip_code}
          </Text>
          <Text variant="bodySmall" style={styles.details}>
            {property.type} • {property.sq_ft.toLocaleString()} sq ft
          </Text>
          <Text variant="bodySmall" style={styles.details}>
            Purchase: ${property.purchase_price.toLocaleString()}
          </Text>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    marginHorizontal: 16,
  },
  chip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  address: {
    marginBottom: 4,
  },
  city: {
    marginBottom: 4,
  },
  details: {
    color: '#666',
    marginTop: 2,
  },
});
