import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { lightColors, darkColors } from '@/src/core/theme';

interface EmptyStateProps {
  message: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  message,
  icon = 'inbox',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={icon}
        size={72}
        color={colors.placeholder}
        style={{ opacity: 0.8 }}
      />
      <Text
        variant="bodyLarge"
        style={[styles.message, { color: colors.textSecondary }]}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.actionButton}
        >
          {actionLabel}
        </Button>
      ) : null}
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
  },
  actionButton: {
    marginTop: 16,
  },
});
