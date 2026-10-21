import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useEntityColor } from '@/src/core/theme';

/** An expense category as a small chip in its own color - on supplier rows and sheets. */
export function CategoryTag({ label, color }: { label: string; color: string | null | undefined }) {
  const { fg, bg } = useEntityColor(color);
  return (
    <View style={[styles.tag, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    maxWidth: '100%',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
