import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PropertyBrief, PropertyType, Renter } from '@/src/shared/types';
import { EmptyState } from '@/src/shared/components/ui';
import { lightColors, darkColors, spacing } from '@/src/core/theme';

interface RenterPropertyTabProps {
  renter: Renter;
}

const TYPE_ICONS: Record<PropertyType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  apartment: 'home-city',
  house: 'home',
  commercial: 'store',
};

function PropertyCard({
  property,
  colors,
  onPress,
}: {
  property: PropertyBrief;
  colors: typeof lightColors;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const typeLabel = t(
    `property.type${property.type.charAt(0).toUpperCase() + property.type.slice(1)}`,
  );

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.cardContent}>
          <View style={[styles.iconBox, { backgroundColor: colors.inputBackground }]}>
            <MaterialCommunityIcons
              name={TYPE_ICONS[property.type] ?? 'home'}
              size={28}
              color={colors.primary}
            />
          </View>
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
              <Text variant="labelSmall" style={styles.badgeText}>
                {typeLabel}
              </Text>
            </View>
            <MaterialCommunityIcons
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
        <EmptyState message={t('renter.noProperty')} icon="home-off" />
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
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginEnd: spacing.md,
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
    color: '#FFFFFF',
    fontSize: 11,
  },
});
