import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Surface, Text, useTheme } from 'react-native-paper';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { spacing } from '@/src/core/theme';

function getInitials(displayName: string | null, email: string | null): string {
  if (displayName) {
    return displayName
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

export function AccountPreviewCard() {
  const { user } = useAppAuth();
  const theme = useTheme();

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? '';
  const email = user?.email ?? '';
  const photoURL = user?.photoURL ?? null;
  const initials = getInitials(user?.displayName ?? null, email || null);

  return (
    <Surface style={styles.surface} elevation={1}>
      <View style={styles.row}>
        {photoURL ? (
          <Avatar.Image size={48} source={{ uri: photoURL }} style={styles.avatar} />
        ) : (
          <Avatar.Text
            size={48}
            label={initials}
            style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
            labelStyle={{ color: theme.colors.onPrimaryContainer }}
          />
        )}
        <View style={styles.info}>
          <Text variant="titleMedium" numberOfLines={1}>
            {displayName}
          </Text>
          {email ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: 16,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginEnd: spacing.md,
  },
  info: {
    flex: 1,
  },
});
