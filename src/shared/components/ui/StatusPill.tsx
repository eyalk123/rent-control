import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MAX_CHROME_FONT_SCALE } from '@/src/core/theme';

interface StatusPillProps {
  label: string;
  /** Tinted wash behind the label, e.g. `colors.revBg`. */
  backgroundColor: string;
  /** Label colour, the full-strength partner of the wash, e.g. `colors.revFg`. */
  color: string;
}

/**
 * A status on a list row: soft tint, strong label.
 *
 * Properties had a dot and coloured text while renters had a solid teal pill, so the same idea
 * looked different on neighbouring tabs. Both use this one now.
 */
export function StatusPill({ label, backgroundColor, color }: StatusPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text
        variant="labelSmall"
        maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
        style={[styles.label, { color }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
});
