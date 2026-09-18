import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Surface, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { spacing } from '@/src/core/theme';
import { useCountry } from '@/src/features/country/CountryContext';
import { flagEmoji } from '@/src/features/country/flagEmoji';

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
  const { config } = useCountry();
  const { t } = useTranslation();
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
          {/*
            The country, beside the name. It is chosen once at signup, behind a gate the
            user sees for about ten seconds and never again, and until now it appeared
            nowhere in the app afterwards — yet it decides the currency, the date order, the
            number grouping and which features exist at all. Somewhere to read it back is
            the least it needs. `useCountry` is already mounted above this screen, so it
            costs no request.
          */}
          <View style={styles.nameRow}>
            <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
              {displayName}
            </Text>
            {config ? (
              <View
                style={[styles.countryPill, { backgroundColor: theme.colors.surfaceVariant }]}
                accessibilityLabel={`${t('country.label')}: ${config.name}`}
              >
                <Text style={styles.flag} maxFontSizeMultiplier={1.2}>
                  {flagEmoji(config.countryCode)}
                </Text>
                <Text
                  variant="bodySmall"
                  numberOfLines={1}
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {config.name}
                </Text>
              </View>
            ) : null}
          </View>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // The name yields before the pill does: a truncated country is unreadable, a truncated
  // name is still recognisable. See MOBILE-DESIGN.md §3.
  name: {
    flexShrink: 1,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    flexShrink: 0,
  },
  flag: {
    fontSize: 13,
  },
});
