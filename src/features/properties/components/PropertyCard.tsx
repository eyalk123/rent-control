import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { Card, Checkbox, Text, useTheme } from 'react-native-paper';
import { Icon } from '@/src/shared/components/ui';
import { useTranslation } from 'react-i18next';
import type { Property } from '@/src/shared/types';
import { lightColors, darkColors } from '@/src/core/theme';
import { getPropertyImageSource } from '@/src/features/properties/utils/propertyImageSource';

interface PropertyCardProps {
  property: Property;
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
}

export const PropertyCard = React.memo(function PropertyCard({ property, onPress, onLongPress, isSelectMode = false, isSelected = false }: PropertyCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.dark;
  const colors = isDark ? darkColors : lightColors;
  const isOccupied =
    property.hasRenters ?? (property.renters?.length ?? 0) > 0;
  const imageSource = getPropertyImageSource(property.image_url);

  return (
    <TouchableOpacity
      onPress={() => onPress(property.id)}
      onLongPress={onLongPress ? () => onLongPress(property.id) : undefined}
      activeOpacity={0.7}
    >
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.content}>
          {isSelectMode && (
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => onPress(property.id)}
            />
          )}
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.thumbnailPlaceholder,
                { backgroundColor: colors.inputBackground },
              ]}
            >
              <Icon
                name="home"
                size={24}
                color={colors.placeholder}
              />
            </View>
          )}
          <View style={styles.info}>
            <Text variant="titleSmall" style={styles.address} numberOfLines={1}>
              {property.address}
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.detail, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {property.city}{property.zip_code ? `, ${property.zip_code}` : ''} • {t(`property.type${property.type.charAt(0).toUpperCase() + property.type.slice(1)}`)}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOccupied ? colors.success : colors.error },
                ]}
              />
              <Text
                variant="labelSmall"
                style={[
                  styles.statusText,
                  {
                    color: isOccupied ? colors.success : colors.error,
                  },
                ]}
              >
                {isOccupied
                  ? t('property.occupancy.occupied')
                  : t('property.occupancy.vacant')}
              </Text>
            </View>
          </View>
          {!isSelectMode && (
            <Icon
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginEnd: 12,
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginEnd: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  address: {
    fontWeight: '600',
    marginBottom: 2,
  },
  detail: {
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginEnd: 4,
  },
  statusText: {
    fontSize: 12,
  },
});
