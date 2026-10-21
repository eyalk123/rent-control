import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useEntityColor } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';
import type { PropertyType } from '@/src/shared/types';
import { usePropertyImageSource } from '@/src/features/properties/hooks/usePropertyImageSource';
import { parseImageUrlKey } from '@/src/features/properties/constants/houseImagePresets';
import { getPropertyTypeIcon } from '@/src/features/properties/constants/propertyTypeIcons';

type ThumbProperty = {
  image_url?: string | null;
  color?: string | null;
  type?: PropertyType | string | null;
};

/**
 * A small picture of a property on its color: the whole illustration for a preset, a cropped
 * photo for an upload, the type icon when there is neither. Used wherever another screen
 * points at a property - "Lives at", a transaction's property, the property picker.
 */
export function PropertyThumb({
  property,
  width,
  height,
  radius = 8,
  iconSize = 20,
}: {
  property: ThumbProperty | null | undefined;
  width: number;
  height: number;
  radius?: number;
  iconSize?: number;
}) {
  const itemColor = useEntityColor(property?.color);
  const imageSource = usePropertyImageSource(property?.image_url);
  const isPreset = property?.image_url ? parseImageUrlKey(property.image_url) != null : false;

  return (
    <View style={[styles.thumb, { width, height, borderRadius: radius, backgroundColor: itemColor.bg }]}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={isPreset ? { width, height } : StyleSheet.absoluteFill}
          resizeMode={isPreset ? 'contain' : 'cover'}
        />
      ) : (
        <Icon
          name={getPropertyTypeIcon((property?.type as PropertyType | undefined) ?? 'apartment')}
          size={iconSize}
          color={itemColor.fg}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
