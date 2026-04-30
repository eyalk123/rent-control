import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors } from '@/src/core/theme';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  message,
  icon = 'info',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <View style={styles.container}>
      <View style={{ opacity: 0.8 }}>
        <Icon name={icon} size={48} color={colors.placeholder} strokeWidth={1.5} />
      </View>
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
