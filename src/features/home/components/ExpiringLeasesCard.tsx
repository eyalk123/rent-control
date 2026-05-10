import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { CompactRenterRow } from './CompactRenterRow';
import type { MockExpiringLease } from '@/src/features/home/mock/homeMockData';

function formatLeaseDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

interface ExpiringLeasesCardProps {
  items: MockExpiringLease[];
}

export function ExpiringLeasesCard({ items }: ExpiringLeasesCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const badgeColor = colors.warning;
  const badgeBg = theme.dark ? 'rgba(194,149,67,0.18)' : 'rgba(212,162,76,0.15)';

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('home.expiringLeases')}</Text>
        <View style={[styles.countBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.countText, { color: badgeColor }]}>{items.length}</Text>
        </View>
      </View>
      <ScrollView
        style={styles.list}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        {items.map((item, idx) => (
          <View key={item.id}>
            {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.outline }]} />}
            <CompactRenterRow
              name={item.name}
              badge={formatLeaseDate(item.expiresAt)}
              badgeColor={badgeColor}
              badgeBg={badgeBg}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    height: 190,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  countBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -spacing.md,
  },
});
