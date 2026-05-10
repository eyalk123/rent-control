import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

interface CompactRenterRowProps {
  name: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  horizontal?: boolean;
}

export function CompactRenterRow({ name, badge, badgeColor, badgeBg, horizontal = false }: CompactRenterRowProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  if (horizontal) {
    return (
      <View style={styles.rowH}>
        <Text style={[styles.nameH, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.rowV}>
      <Text style={[styles.nameV, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
      <View style={[styles.badge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowH: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  nameH: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  rowV: {
    paddingVertical: spacing.xs,
    gap: 2,
  },
  nameV: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 17,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
