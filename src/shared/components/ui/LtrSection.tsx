import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export function LtrSection({ children, style }: Props) {
  return <View style={[styles.ltr, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  ltr: {
    direction: 'ltr',
  },
});
