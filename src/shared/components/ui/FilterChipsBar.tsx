import * as Haptics from 'expo-haptics';
import React, { useImperativeHandle, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui/Icon';

export interface FilterChip {
  key: string;
  label: string;
  selectedLabel: string | null;
  onPress: () => void;
  onClear: () => void;
}

export interface FilterChipsBarHandle {
  scrollToStart: () => void;
}

interface FilterChipsBarProps {
  chips: FilterChip[];
  stretch?: boolean;
  ref?: React.Ref<FilterChipsBarHandle>;
}

// React 19: ref is a plain prop — no forwardRef needed
export function FilterChipsBar({ chips, stretch, ref }: FilterChipsBarProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const scrollRef = useRef<ScrollView>(null);

  useImperativeHandle(ref, () => ({
    scrollToStart: () => {
      if (!stretch) scrollRef.current?.scrollTo({ x: 0, animated: false });
    },
  }), [stretch]);

  const chipElements = chips.map((chip) => {
    const active = chip.selectedLabel !== null;
    return (
      <Pressable
        key={chip.key}
        onPress={() => {
          Haptics.selectionAsync();
          chip.onPress();
        }}
        style={({ pressed }) => [
          styles.chip,
          stretch && styles.chipStretch,
          {
            backgroundColor: active ? colors.primary : 'transparent',
            borderColor: active ? colors.primary : colors.outline,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.chipLabel,
            stretch && styles.chipLabelStretch,
            { color: active ? colors.onPrimary : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {active ? chip.selectedLabel! : chip.label}
        </Text>
        {active ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Haptics.selectionAsync();
              chip.onClear();
            }}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Icon name="x" size={12} color={colors.onPrimary} />
          </Pressable>
        ) : (
          <View style={styles.iconBtn}>
            <Icon name="chevron-down" size={12} color={colors.textSecondary} />
          </View>
        )}
      </Pressable>
    );
  });

  if (stretch) {
    return <View style={styles.stretchRow}>{chipElements}</View>;
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {chipElements}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  stretchRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
    maxWidth: 140,
  },
  chipStretch: {
    flex: 1,
    maxWidth: undefined,
    paddingVertical: 10,
    borderWidth: 1.5,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  chipLabelStretch: {
    fontSize: 14,
    fontWeight: '700',
  },
  iconBtn: {
    padding: 1,
  },
});
