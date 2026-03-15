import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({
  children,
  edges = ['top', 'bottom', 'left', 'right'],
}: ScreenContainerProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
