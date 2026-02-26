import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface EmptyStateProps {
  message: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export function EmptyState({
  message,
  icon = 'inbox',
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={64} color="#999" />
      <Text variant="bodyLarge" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
});
