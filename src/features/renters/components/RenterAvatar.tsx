import React from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { Renter } from '@/src/shared/types';
import { lightColors, darkColors } from '@/src/core/theme';
import { useRenterContactImage } from '@/src/features/renters/hooks/useRenterContactImage';

interface RenterAvatarProps {
  renter: Renter;
  size?: number;
  /** Override background when showing initials. */
  backgroundColor?: string;
  /** Override text color when showing initials. */
  textColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function RenterAvatar({
  renter,
  size = 40,
  backgroundColor,
  textColor,
  style,
}: RenterAvatarProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const imageUri = useRenterContactImage(renter.contact_id);

  const bg = backgroundColor ?? colors.inputBackground;
  const txtColor = textColor ?? colors.textSecondary;

  const initials = `${renter.first_name?.[0] ?? ''}${renter.last_name?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, style]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text variant="labelLarge" style={{ color: txtColor, fontSize: size * 0.4, lineHeight: size * 0.5 }}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
});
