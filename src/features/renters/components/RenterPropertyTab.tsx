import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { Icon, type IconName } from '@/src/shared/components/ui';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PropertyBrief, PropertyType, Renter } from '@/src/shared/types';
import { EmptyState } from '@/src/shared/components/ui';
import { lightColors, darkColors, spacing } from '@/src/core/theme';
import { getPropertyImageSource } from '@/src/features/properties/utils/propertyImageSource';

type ThemeColors = typeof lightColors | typeof darkColors;

interface RenterPropertyTabProps {
  renter: Renter;
}

const TYPE_ICONS: Record<PropertyType, IconName> = {
  apartment: 'building',
  house: 'home',
  commercial: 'store',
};

function PropertyCard({
  property,
  colors,
  onPress,
}: {
  property: PropertyBrief;
  colors: ThemeColors;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const typeLabel = t(
    `property.type${property.type.charAt(0).toUpperCase() + property.type.slice(1)}`,
  );
  const imageSource = getPropertyImageSource(property.image_url);

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.cardContent}>
          {imageSource ? (
            <Image source={imageSource} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.inputBackground }]}>
              <Icon
                name={TYPE_ICONS[property.type] ?? 'home'}
                size={24}
                color={colors.primary}
              />
            </View>
          )}
          <View style={styles.info}>
            <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
              {property.address}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {property.city}
            </Text>
          </View>
          <View style={styles.rightSection}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text variant="labelSmall" style={[styles.badgeText, { color: colors.onPrimary }]}>
                {typeLabel}
              </Text>
            </View>
            <Icon
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

export function RenterPropertyTab({ renter }: RenterPropertyTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();

  if (!renter.property) {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState message={t('renter.noProperty')} icon="home" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <PropertyCard
        property={renter.property}
        colors={colors}
        onPress={() => router.push(`/properties/${renter.property!.id}` as any)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginEnd: spacing.md,
  },
  thumbnailPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginEnd: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    marginBottom: 2,
  },
  rightSection: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
  },
});
