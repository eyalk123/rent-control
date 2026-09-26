import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Button, Checkbox, Text, useTheme } from 'react-native-paper';
import { Icon, ListCard, StatusPill } from '@/src/shared/components/ui';
import { useTranslation } from 'react-i18next';
import type { Property } from '@/src/shared/types';
import { lightColors, darkColors } from '@/src/core/theme';
import { getCurrentRenters } from '@/src/shared/utils/renterStatus';
import { usePropertyImageSource } from '@/src/features/properties/hooks/usePropertyImageSource';
import { getPropertyTypeIcon } from '@/src/features/properties/constants/propertyTypeIcons';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import { LockedBadge } from '@/src/features/subscription/components/LockedBadge';

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
  const currentRenters = getCurrentRenters(property.renters);
  // The server sends `hasRenters`; the fallback is for payloads that only carry the
  // renter list. Either way a past tenant does not occupy the flat — they stay attached to
  // the property as its history, which is why counting the list marked it occupied forever.
  const isOccupied = property.hasRenters ?? currentRenters.length > 0;
  const imageSource = usePropertyImageSource(property.image_url);
  const floorApartment = formatFloorApartment(property, t, false);
  const typeLabel = t(`property.type${property.type.charAt(0).toUpperCase() + property.type.slice(1)}`);
  // No ZIP code here: it is on the detail screen, and on a list row it was the part that
  // pushed the property type off the end of the line.
  // Floor/apartment gets its own line, as the card had before. Run into one line with the
  // city and type, it wrapped mid-list and left a "•" hanging at the end of the first line.
  const cityType = `${property.city} • ${typeLabel}`;

  // Who lives there, on the side of the card that used to hold only a chevron. Two tenants
  // on one lease show as the first name plus a count rather than a truncated pair.
  const firstRenter = currentRenters[0];
  const renterLabel = firstRenter
    ? `${firstRenter.first_name} ${firstRenter.last_name}`.trim() +
      (currentRenters.length > 1 ? ` +${currentRenters.length - 1}` : '')
    : null;

  return (
    <ListCard
      onPress={() => onPress(property.id)}
      onLongPress={onLongPress ? () => onLongPress(property.id) : undefined}
    >
      {isSelectMode && (
        <Checkbox
          status={isSelected ? 'checked' : 'unchecked'}
          onPress={() => onPress(property.id)}
        />
      )}
      {imageSource ? (
        <Image source={imageSource} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbnail, styles.iconBox, { backgroundColor: colors.primaryBg }]}>
          <Icon name={getPropertyTypeIcon(property.type)} size={24} color={colors.primary} />
        </View>
      )}
      <View style={styles.info}>
        <Text variant="titleSmall" style={[styles.address, { color: colors.textPrimary }]} numberOfLines={1}>
          {property.address}
        </Text>
        {floorApartment !== '' && (
          <Text
            variant="bodySmall"
            style={{ color: colors.textSecondary }}
            numberOfLines={1}
          >
            {floorApartment}
          </Text>
        )}
        <Text
          variant="bodySmall"
          style={[styles.detail, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {cityType}
        </Text>
        <View style={styles.statusRow}>
          <StatusPill
            label={isOccupied ? t('property.occupancy.occupied') : t('property.occupancy.vacant')}
            backgroundColor={isOccupied ? colors.revBg : colors.expBg}
            color={isOccupied ? colors.revFg : colors.expFg}
          />
        </View>
      </View>
      {renterLabel && !isSelectMode ? (
        <View style={styles.trailing}>
          <Icon name="user" size={14} color={colors.textSecondary} />
          <Text
            variant="labelMedium"
            style={[styles.trailingText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {renterLabel}
          </Text>
        </View>
      ) : null}
    </ListCard>
  );
});

interface LockedPropertyCardProps {
  property: Property;
  /** Toggles selection in select mode. Outside it, the row itself does nothing. */
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  onUpgrade: () => void;
  onDelete: (id: number) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
}

/**
 * A property over the plan's limit. The API sends only enough to recognise it — address,
 * city, type — and refuses everything else, so this row has no photo, no occupancy, no
 * renter and does not open. It offers the two ways out instead: a bigger plan, or deleting
 * a property to get back under the limit. Still selectable, so a bulk delete can include it.
 */
export const LockedPropertyCard = React.memo(function LockedPropertyCard({
  property,
  onPress,
  onLongPress,
  onUpgrade,
  onDelete,
  isSelectMode = false,
  isSelected = false,
}: LockedPropertyCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const floorApartment = formatFloorApartment(property, t, false);
  const typeLabel = t(`property.type${property.type.charAt(0).toUpperCase() + property.type.slice(1)}`);

  return (
    <ListCard
      onPress={() => { if (isSelectMode) onPress(property.id); }}
      onLongPress={onLongPress ? () => onLongPress(property.id) : undefined}
    >
      {isSelectMode && (
        <Checkbox
          status={isSelected ? 'checked' : 'unchecked'}
          onPress={() => onPress(property.id)}
        />
      )}
      <View style={[styles.thumbnail, styles.iconBox, { backgroundColor: colors.inputBackground }]}>
        <Icon name="lock" size={22} color={colors.textSecondary} />
      </View>
      <View style={styles.info} testID="locked-property-card">
        <Text variant="titleSmall" style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
          {property.address}
          {floorApartment !== '' ? ` ${floorApartment}` : ''}
        </Text>
        <Text variant="bodySmall" style={[styles.detail, { color: colors.textSecondary }]} numberOfLines={1}>
          {`${property.city} • ${typeLabel}`}
        </Text>
        <View style={styles.statusRow}>
          <LockedBadge compact />
        </View>
        {!isSelectMode && (
          <View style={styles.lockedActions}>
            <Button mode="contained" compact onPress={onUpgrade}>
              {t('subscription.lockedCard.upgrade')}
            </Button>
            <Button mode="outlined" compact textColor={colors.error} onPress={() => onDelete(property.id)}>
              {t('subscription.lockedCard.delete')}
            </Button>
          </View>
        )}
      </View>
    </ListCard>
  );
});

const styles = StyleSheet.create({
  lockedActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 3,
  },
  address: {
    fontWeight: '600',
  },
  detail: {
    marginBottom: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // Wraps rather than squeezing, so a pill never truncates on a narrow phone.
    flexWrap: 'wrap',
    gap: 6,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '38%',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  trailingText: {
    flexShrink: 1,
  },
});
