import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, MAX_CHROME_FONT_SCALE } from '@/src/core/theme';

export interface FilterSegment<T extends string> {
  value: T;
  label: string;
  /** Both or neither. Omit to get the default navy tint. */
  activeBg?: string;
  activeFg?: string;
}

interface FilterSegmentedControlProps<T extends string> {
  segments: FilterSegment<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/**
 * The filter bar's version of a segmented control: every option on screen at once, so the
 * selected one is legible without opening anything.
 *
 * It is deliberately not `SegmentedControl`. That one is a form field - bordered track, solid
 * navy thumb, a label above - and it carries too much weight for a row that sits under the
 * filter chips. This one is a quiet track with a tinted thumb.
 *
 * Segments may carry their own active colours where the choice is itself a colour the app
 * already uses for meaning (revenue teal, expense rust). Where it is not, they inherit the
 * navy tint and the chips and the segments agree.
 */
function FilterSegmentedControlInner<T extends string>({
  segments,
  value,
  onChange,
  accessibilityLabel,
}: FilterSegmentedControlProps<T>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const trackColor = theme.dark ? 'rgba(241,236,223,0.08)' : 'rgba(26,45,74,0.07)';

  // Tinted thumb, textPrimary label. primary as the label colour measures 2.04:1 against this
  // tint in dark - it is a mid-tone navy and there is nothing for it to contrast with on a
  // navy track. textPrimary gives 9.9:1 light and 9.0:1 dark, and the tint still reads navy.
  const defaultActiveBg = colors.primary + '1F';
  const defaultActiveFg = colors.textPrimary;

  const handlePress = (next: T) => {
    if (next === value) return;
    Haptics.selectionAsync();
    onChange(next);
  };

  return (
    <View
      style={[styles.track, { backgroundColor: trackColor }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <Pressable
            key={seg.value}
            onPress={() => handlePress(seg.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, checked: active }}
            style={({ pressed }) => [
              styles.segment,
              active && { backgroundColor: seg.activeBg ?? defaultActiveBg },
              pressed && !active && { opacity: 0.6 },
            ]}
          >
            <Text
              maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
              numberOfLines={1}
              style={[
                styles.label,
                { color: active ? (seg.activeFg ?? defaultActiveFg) : colors.textSecondary },
                active && styles.labelActive,
              ]}
            >
              {seg.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const FilterSegmentedControl = React.memo(
  FilterSegmentedControlInner,
) as typeof FilterSegmentedControlInner;

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '700',
  },
});
