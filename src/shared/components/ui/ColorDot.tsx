import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useEntityColor } from '@/src/core/theme';

type ColorDotProps = {
  /** The item's stored color key. Unknown or missing renders the neutral shade. */
  color: string | null | undefined;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * The small mark beside an address or a name that says which property (or renter) a row is
 * about. Decorative: the name next to it carries the meaning, so screen readers skip it.
 */
export const ColorDot = React.memo(function ColorDot({ color, size = 8, style }: ColorDotProps) {
  const { fg } = useEntityColor(color);
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.dot, { width: size, height: size, borderRadius: size / 2, backgroundColor: fg }, style]}
    />
  );
});

const styles = StyleSheet.create({
  dot: {
    flexShrink: 0,
  },
});
