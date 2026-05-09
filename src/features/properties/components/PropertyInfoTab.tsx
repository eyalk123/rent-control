import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { Icon, type IconName } from '@/src/shared/components/ui';
import { useTranslation } from 'react-i18next';
import type { Property, PropertyType } from '@/src/shared/types';
import { lightColors, darkColors, spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import { StatBox, IconDetailRow, DocumentsCard } from '@/src/shared/components/ui';

interface PropertyInfoTabProps {
  property: Property;
}

const TYPE_ICONS: Record<PropertyType, IconName> = {
  apartment: 'building',
  house: 'home',
  commercial: 'store',
};

function ExpandableNotesRow({
  label,
  value,
  iconColor,
  secondaryColor,
}: {
  label: string;
  value: string;
  iconColor: string;
  secondaryColor: string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);
  return (
    <View style={styles.notesRow}>
      <View style={styles.iconRowLeft}>
        <Icon name="file-text" size={20} color={iconColor} />
        <Text variant="bodyMedium" style={{ color: secondaryColor }}>
          {label}
        </Text>
      </View>
      <Text
        variant="bodyMedium"
        numberOfLines={expanded ? undefined : 2}
        style={styles.notesText}
      >
        {value}
      </Text>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
        <Text variant="labelSmall" style={[styles.notesToggle, { color: iconColor }]}>
          {expanded ? t('common.showLess') : t('common.showMore')}
        </Text>
      </TouchableOpacity>
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
    property.house_committee != null ||
    (property.inventory_notes != null && property.inventory_notes !== '');

  const documents = [
    property.basic_contract_url
      ? { label: t('documents.basicContract'), url: property.basic_contract_url, icon: 'file-text' as const }
      : null,
    property.land_registry_url
      ? { label: t('documents.landRegistry'), url: property.land_registry_url, icon: 'bank' as const }
      : null,
  ].filter(Boolean) as { label: string; url: string; icon: 'file-text' | 'bank' }[];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.statsRow}>
        <StatBox
          icon={TYPE_ICONS[property.type]}
          value={translateType(property.type)}
          label={t('property.typeLabel')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.primary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
          valueVariant="titleMedium"
        />
        <StatBox
          icon="ruler"
          value={property.sq_ft.toLocaleString()}
          label={t('property.surfaceArea')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.secondary}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
          valueVariant="titleMedium"
        />
        <StatBox
          icon={hasRooms ? 'door-open' : 'map-pin'}
          value={hasRooms ? String(property.number_of_rooms) : property.zip_code}
          label={hasRooms ? t('property.numberOfRooms') : t('property.zipCode')}
          backgroundColor={colors.inputBackground}
          iconColor={colors.sectionAccent}
          textColor={colors.textPrimary}
          secondaryColor={colors.textSecondary}
          valueVariant="titleMedium"
        />
      </View>

      <Card style={styles.card} mode="outlined">
        <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
          <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: colors.onPrimary }]}>
            {t('property.basicInfo')}
          </Text>
        </View>
        <Card.Content style={styles.cardContent}>
          {hasRooms && (
            <IconDetailRow
              icon="map-pin"
              label={t('property.zipCode')}
              value={property.zip_code}
              iconColor={colors.primary}
              secondaryColor={colors.textSecondary}
            />
          )}
          {property.property_owner != null && property.property_owner !== '' && (
            <IconDetailRow
              icon="briefcase"
              label={t('property.propertyOwner')}
              value={property.property_owner}
              iconColor={colors.primary}
              secondaryColor={colors.textSecondary}
            />
          )}
        </Card.Content>
      </Card>

      <DocumentsCard documents={documents} />

      {hasPropertyDetails && (
        <Card style={styles.card} mode="outlined">
          <View style={[styles.sectionHeader, { backgroundColor: colors.sectionAccent }]}>
            <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: colors.onPrimary }]}>
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
                icon="zap"
                label={t('property.electricityMeterNumber')}
                value={property.electricity_meter_number}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
            {property.water_meter_tax != null && (
              <IconDetailRow
                icon="droplet"
                label={t('property.waterMeterTax')}
                value={formatMoney(property.water_meter_tax)}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
            {property.property_tax != null && (
              <IconDetailRow
                icon="file-text"
                label={t('property.propertyTax')}
                value={formatMoney(property.property_tax)}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
            {property.house_committee != null && (
              <IconDetailRow
                icon="users"
                label={t('property.houseCommittee')}
                value={formatMoney(property.house_committee)}
                iconColor={colors.sectionAccent}
                secondaryColor={colors.textSecondary}
              />
            )}
            {property.inventory_notes != null && property.inventory_notes !== '' && (
              <ExpandableNotesRow
                label={t('property.inventoryNotes')}
                value={property.inventory_notes}
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
  iconRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  notesRow: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  notesText: {
    flexShrink: 1,
  },
  notesToggle: {
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
});
