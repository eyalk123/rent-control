import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Icon } from './Icon';

/**
 * A rounded square with someone's initials, for the people who are not renters - suppliers
 * and property owners. Renters use `RenterAvatar`, which can also show a contact photo.
 * Decorative: the name beside it carries the meaning.
 */
export function InitialsTile({
  name,
  size,
  radius,
  backgroundColor,
  textColor,
}: {
  name: string;
  size: number;
  radius: number;
  backgroundColor: string;
  textColor: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.tile, { width: size, height: size, borderRadius: radius, backgroundColor }]}
    >
      {/* Before a name is typed: a person, as on the renter form, rather than a "?". */}
      {initials ? (
        <Text style={[styles.text, { color: textColor, fontSize: Math.round(size * 0.34) }]}>{initials}</Text>
      ) : (
        <Icon name="user" size={Math.round(size * 0.46)} color={textColor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    fontWeight: '700',
  },
});
