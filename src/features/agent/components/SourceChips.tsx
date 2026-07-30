import React from 'react';
import { View } from 'react-native';
import { Chip, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { SourceRef, SourceRefType } from '../types';

const ICON: Record<SourceRefType, string> = {
  renter: 'account',
  property: 'home',
  transaction: 'receipt',
};

const ROUTE: Record<SourceRefType, (id: number) => string> = {
  renter: (id) => `/renters/${id}`,
  property: (id) => `/properties/${id}`,
  transaction: (id) => `/transactions/${id}`,
};

/** Deliberate, out-of-prose source chips. Tapping one navigates to the record's detail
 *  screen — never inline links, so no accidental navigation. */
export function SourceChips({ sources }: { sources: SourceRef[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  if (sources.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 }}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('agent.sources')}
      </Text>
      {sources.map((s) => (
        <Chip
          key={`${s.type}:${s.id}`}
          icon={ICON[s.type]}
          compact
          onPress={() => router.push(ROUTE[s.type](s.id) as any)}
        >
          {s.label}
        </Chip>
      ))}
    </View>
  );
}
