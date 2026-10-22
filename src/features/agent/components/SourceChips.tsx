import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, useEntityColor } from '@/src/core/theme';
import { Icon, InitialsTile, type IconName } from '@/src/shared/components/ui';
import { usePropertyContext, useRenterContext } from '@/src/context';
import type { SourceRef, SourceRefType } from '../types';

const ICON: Record<SourceRefType, IconName> = {
  renter: 'user',
  property: 'home',
  transaction: 'receipt',
};

const ROUTE: Record<SourceRefType, (id: number) => string> = {
  renter: (id) => `/renters/${id}`,
  property: (id) => `/properties/${id}`,
  transaction: (id) => `/transactions/${id}`,
};

/**
 * One source, in the color of the renter or property it points at - the same color the
 * record wears on its own screen. A transaction, or a record not loaded here, stays neutral.
 */
function SourceChip({ source }: { source: SourceRef }) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { renters } = useRenterContext();
  const { properties } = usePropertyContext();
  const color =
    source.type === 'renter'
      ? renters.find((r) => r.id === source.id)?.color
      : source.type === 'property'
        ? properties.find((p) => p.id === source.id)?.color
        : null;
  const tint = useEntityColor(color);
  const bg = color ? tint.bg : colors.controlFill;
  const fg = color ? tint.fg : colors.textSecondary;

  return (
    <TouchableOpacity
      onPress={() => router.push(ROUTE[source.type](source.id) as any)}
      activeOpacity={0.7}
      accessibilityRole="link"
      // 36 tall; the slop takes the target to 44.
      hitSlop={{ top: 4, bottom: 4 }}
      style={[styles.chip, { backgroundColor: bg }]}
    >
      {source.type === 'renter' ? (
        <InitialsTile name={source.label} size={24} radius={8} backgroundColor={theme.colors.surface} textColor={fg} />
      ) : (
        <View style={[styles.mark, { backgroundColor: theme.colors.surface }]}>
          <Icon name={ICON[source.type]} size={14} color={fg} />
        </View>
      )}
      <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>
        {source.label}
      </Text>
    </TouchableOpacity>
  );
}

/** Deliberate, out-of-prose source chips. Tapping one navigates to the record's detail
 *  screen — never inline links, so no accidental navigation. */
export function SourceChips({ sources }: { sources: SourceRef[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  if (sources.length === 0) return null;

  return (
    <View style={styles.row}>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('agent.sources')}
      </Text>
      {sources.map((s) => (
        <SourceChip key={`${s.type}:${s.id}`} source={s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    height: 36,
    borderRadius: 18,
    paddingStart: 6,
    paddingEnd: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
});
