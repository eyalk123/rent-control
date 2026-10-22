import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PropertyBrief, Renter } from '@/src/shared/types';
import { ColorDot, Icon, EmptyState } from '@/src/shared/components/ui';
import { PropertyPicker } from '@/src/features/properties/components/PropertyPicker';
import { cardShadow, lightColors, darkColors, ICON_SM, radii, spacing } from '@/src/core/theme';
import { PropertyThumb } from '@/src/features/properties/components/PropertyThumb';
import { propertyTypeLabelKey } from '@/src/features/properties/constants/propertyTypeLabel';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import { useLanguageContext } from '@/src/context';

type ThemeColors = typeof lightColors | typeof darkColors;

interface RenterPropertyTabProps {
  renter: Renter;
  /** Attaches the renter to a property. Owned by the screen, which holds the renter state. */
  onLinkProperty: (propertyId: number) => void;
  linkPending?: boolean;
}

/**
 * The renter's property as a card in its own color - the picture on its tint and its dot -
 * like the property card on a transaction and "Lives at" on the Info tab.
 */
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
  const { isRtl } = useLanguageContext();
  const theme = useTheme();
  const floorApartment = formatFloorApartment(property, t, false);
  const detail = [floorApartment, property.city, t(propertyTypeLabelKey(property.type))]
    .filter(Boolean)
    .join(' · ');

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={property.address}
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
    >
      <PropertyThumb property={property} width={64} height={48} radius={10} iconSize={22} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <ColorDot color={property.color} />
          <Text variant="bodyLarge" style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {property.address}
          </Text>
        </View>
        <Text variant="labelSmall" style={{ color: colors.textSecondary }} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Icon name={isRtl ? 'chevron-left' : 'chevron-right'} size={ICON_SM} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function RenterPropertyTab({
  renter,
  onLinkProperty,
  linkPending,
}: RenterPropertyTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const [linking, setLinking] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!renter.property) {
    // Inline rather than a dialog: the picker opens its own overlay list, which a Paper
    // Dialog would clip. Same shape as the web client's link card.
    if (linking) {
      return (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.linkCard} mode="outlined">
            <Card.Content style={styles.linkContent}>
              <Text variant="titleSmall">{t('renter.linkProperty')}</Text>
              <PropertyPicker
                value={selectedId}
                onChange={setSelectedId}
                label={t('renter.selectProperty')}
              />
              <View style={styles.linkActions}>
                <Button
                  onPress={() => {
                    setLinking(false);
                    setSelectedId(null);
                  }}
                  disabled={linkPending}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  mode="contained"
                  loading={linkPending}
                  // The picker keeps an "Unassigned" row, which is not a link target.
                  disabled={selectedId == null || linkPending}
                  onPress={() => selectedId != null && onLinkProperty(selectedId)}
                >
                  {t('renter.link')}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          message={t('renter.noProperty')}
          icon="home"
          actionLabel={t('renter.linkProperty')}
          onAction={() => setLinking(true)}
        />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.lg,
    ...cardShadow,
  },
  linkCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  linkContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  linkActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    fontWeight: '600',
  },
});
