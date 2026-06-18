import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui/Icon';
import type { FilterChip } from './FilterChipsBar';

interface ActiveFilterPillsProps {
  chips: FilterChip[];
}

export function ActiveFilterPills({ chips }: ActiveFilterPillsProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const activeChips = chips.filter((c) => c.selectedLabel !== null);
  if (activeChips.length === 0) return null;

  // secondary is #D4A24C (light) / #C29543 (dark) — append hex alpha for opacity
  const pillBg = theme.dark ? `${colors.secondary}4D` : `${colors.secondary}8C`;
  const pillBorder = colors.secondary;
  const pillFg = theme.colors.onSurface;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {activeChips.map((chip) => (
        <View
          key={chip.key}
          style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}
        >
          <Text
            style={[styles.label, { color: pillFg }]}
            numberOfLines={1}
          >
            {chip.label}: {chip.selectedLabel}
          </Text>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              chip.onClear();
            }}
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Icon name="x" size={11} color={pillFg} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
    gap: 4,
    maxWidth: 220,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  clearBtn: {
    padding: 2,
  },
});
