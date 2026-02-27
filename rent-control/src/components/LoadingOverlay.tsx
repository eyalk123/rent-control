import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';

interface LoadingOverlayProps {
  visible: boolean;
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  const theme = useTheme();
  if (!visible) return null;

  const overlayColor = theme.dark
    ? 'rgba(0, 0, 0, 0.7)'
    : 'rgba(255, 255, 255, 0.7)';

  return (
    <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
