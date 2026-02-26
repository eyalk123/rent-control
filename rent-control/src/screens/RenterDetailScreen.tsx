import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Linking,
} from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getRenterById } from '@/src/api/renters';
import type { Renter } from '@/src/types';
import { LoadingOverlay } from '@/src/components';

export function RenterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [renter, setRenter] = useState<Renter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRenter() {
      const numericId = Number(id);
      if (isNaN(numericId)) {
        setError('Invalid renter ID');
        setLoading(false);
        return;
      }
      try {
        const data = await getRenterById(numericId);
        setRenter(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load renter');
      } finally {
        setLoading(false);
      }
    }
    fetchRenter();
  }, [id]);

  const handleEdit = () => {
    if (renter) {
      router.push(`/(tabs)/renters/edit/${renter.id}` as any);
    }
  };

  const handleCall = () => {
    if (renter?.phone) {
      Linking.openURL(`tel:${renter.phone}`);
    }
  };

  const handleSms = () => {
    if (renter?.phone) {
      Linking.openURL(`sms:${renter.phone}`);
    }
  };

  const handleEmail = () => {
    if (renter?.email) {
      Linking.openURL(`mailto:${renter.email}`);
    }
  };

  if (loading) {
    return <LoadingOverlay visible={true} />;
  }

  if (error || !renter) {
    return (
      <View style={styles.container}>
        <Text variant="bodyLarge">{error ?? 'Renter not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.name}>
            {renter.first_name} {renter.last_name}
          </Text>
          <Text variant="bodyMedium" style={styles.detail}>
            Property: {renter.property?.address ?? 'Unassigned'}
          </Text>
          <Text variant="bodyMedium" style={styles.detail}>
            Phone: {renter.phone}
          </Text>
          <Text variant="bodyMedium" style={styles.detail}>
            Email: {renter.email}
          </Text>
          <Text variant="bodyMedium" style={styles.detail}>
            Monthly Rent: ${renter.monthly_rent.toLocaleString()}
          </Text>
          <Text variant="bodyMedium" style={styles.detail}>
            Lease: {renter.lease_start} – {renter.lease_end}
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={handleCall} icon="phone" style={styles.actionButton}>
          Call
        </Button>
        <Button mode="outlined" onPress={handleSms} icon="message" style={styles.actionButton}>
          SMS
        </Button>
        <Button mode="outlined" onPress={handleEmail} icon="email" style={styles.actionButton}>
          Email
        </Button>
      </View>

      <Button mode="contained" onPress={handleEdit} style={styles.editButton}>
        Edit Renter
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
  card: {
    marginBottom: 16,
  },
  name: {
    marginBottom: 12,
  },
  detail: {
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  editButton: {
    marginTop: 8,
  },
});
