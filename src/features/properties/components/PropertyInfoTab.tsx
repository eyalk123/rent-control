import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import type { Property, PropertyType } from '@/src/shared/types';
import { lightColors, darkColors, spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';

interface PropertyInfoTabProps {
  property: Property;
}

const TYPE_ICONS: Record<PropertyType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  apartment: 'home-city',
  house: 'home',
  commercial: 'store',
};

function StatBox({
  icon,
  value,
  label,
  backgroundColor,
  iconColor,
  textColor,
  secondaryColor,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string;
  label: string;
  backgroundColor: string;
  iconColor: string;
  textColor: string;
  secondaryColor: string;
}) {
  return (
    <View style={[styles.statBox, { backgroundColor }]}>
      <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
      <Text variant="titleMedium" style={[styles.statValue, { color: textColor }]}>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: secondaryColor }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function IconDetailRow({
  icon,
  label,
  value,
  iconColor,
  secondaryColor,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
  iconColor: string;
  secondaryColor: string;
}) {
  return (
    <View style={styles.iconRow}>
      <View style={styles.iconRowLeft}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        <Text variant="bodyMedium" style={{ color: secondaryColor }}>
          {label}
        </Text>
      </View>
      <Text variant="bodyMedium" style={styles.iconRowValue}>
        {value}
      </Text>
    </View>
  );
}

export function PropertyInfoTab({ property }: PropertyInfoTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const translateType = (type: string) =>
    t(`property.type${type.charAt(0).toUpperCase() + type.slice(1)}`);

  const hasRooms = property.number_of_rooms != null;

  const hasPropertyDetails =
    (Array.isArray(property.parking_numbers) && property.parking_numbers.length > 0) ||
    (property.electricity_meter_number != null && property.electricity_meter_number !== '') ||
    property.water_meter_tax != null ||
    property.property_tax != null ||
    property.house_committee != null;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Stat boxes */}
      <View style={styles.statsRow}>
        <StatBox
          icon={TYPE_ICONS[property.type]}
          value={translateType(property.type)}
          label={t('property.typeLabel')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.primary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
        <StatBox
          icon="ruler-square"
          value={property.sq_ft.toLocaleString()}
          label={t('property.surfaceArea')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.secondary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
        <StatBox
          icon={hasRooms ? 'door-open' : 'map-marker'}
          value={hasRooms ? String(property.number_of_rooms) : property.zip_code}
          label={hasRooms ? t('property.numberOfRooms') : t('property.zipCode')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.sectionAccent}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
        />
      </View>

      {/* Overview card */}
      <Card style={styles.card} mode="outlined">
        <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
          <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: '#FFF' }]}>
            {t('property.basicInfo')}
          </Text>
        </View>
        <Card.Content style={styles.cardContent}>
          {hasRooms && (
            <IconDetailRow
              icon="map-marker"
              label={t('property.zipCode')}
              value={property.zip_code}
              iconColor={colors.primary}
              secondaryColor={colors.textSecondary}
            />
          )}
          {property.property_owner != null && property.property_owner !== '' && (
            <IconDetailRow
              icon="account-tie"
              label={t('property.propertyOwner')}
              value={property.property_owner}
              iconColor={colors.primary}
              secondaryColor={colors.textSecondary}
            />
          )}
          <IconDetailRow
            icon="cash"
            label={t('property.purchasePrice')}
            value={formatMoney(property.purchase_price)}
            iconColor={colors.primary}
            secondaryColor={colors.textSecondary}
          />
        </Card.Content>
      </Card>

      {/* Property Details card */}
      {hasPropertyDetails && (
        <Card style={styles.card} mode="outlined">
          <View style={[styles.sectionHeader, { backgroundColor: colors.sectionAccent }]}>
            <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: '#FFF' }]}>
              {t('property.details')}
            </Text>
          </View>
          <Card.Content style={styles.cardContent}>
            {Array.isArray(property.parking_numbers) && property.parking_numbers.length > 0 && (
              <IconDetailRow
                icon="car"
                label={t('property.parkingNumbers')}
                value={property.parking_numbers.join(', ')}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
            {property.electricity_meter_number != null && property.electricity_meter_number !== '' && (
              <IconDetailRow
                icon="flash"
                label={t('property.electricityMeterNumber')}
                value={property.electricity_meter_number}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
            {property.water_meter_tax != null && (
              <IconDetailRow
                icon="water"
                label={t('property.waterMeterTax')}
                value={formatMoney(property.water_meter_tax)}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
            {property.property_tax != null && (
              <IconDetailRow
                icon="file-document"
                label={t('property.propertyTax')}
                value={formatMoney(property.property_tax)}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
            {property.house_committee != null && (
              <IconDetailRow
                icon="account-group"
                label={t('property.houseCommittee')}
                value={formatMoney(property.house_committee)}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    gap: spacing.xs,
  },
  statValue: {
    fontWeight: '700',
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionHeaderText: {
    fontWeight: '600',
  },
  cardContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  iconRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  iconRowValue: {
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 0,
  },
});
