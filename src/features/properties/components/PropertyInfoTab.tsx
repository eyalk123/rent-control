import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Property } from '@/src/shared/types';
import { lightColors, darkColors, spacing, ICON_SM } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import { Icon, StatBox, DetailRow, DetailSection } from '@/src/shared/components/ui';

interface PropertyInfoTabProps {
  property: Property;
}

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
        <Icon name="file-text" size={ICON_SM} color={iconColor} />
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

  const hasRooms = property.number_of_rooms != null;

  const hasFloorOrApartment =
    property.floor != null ||
    (property.apartment != null && property.apartment !== '');

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {hasFloorOrApartment && (
        <View style={styles.statsRow}>
          {property.floor != null && (
            <StatBox
              icon="layers"
              value={String(property.floor)}
              label={t('property.floor')}
              backgroundColor={colors.inputBackground}
              iconColor={colors.primary}
              textColor={colors.textPrimary}
              secondaryColor={colors.textSecondary}
              valueVariant="titleMedium"
            />
          )}
          {property.apartment != null && property.apartment !== '' && (
            <StatBox
              icon="hash"
              value={property.apartment}
              label={t('property.apartment')}
              backgroundColor={colors.inputBackground}
              iconColor={colors.primary}
              textColor={colors.textPrimary}
              secondaryColor={colors.textSecondary}
              valueVariant="titleMedium"
            />
          )}
        </View>
      )}
      <View style={styles.statsRow}>
        {/* No Type tile: the header medallion already carries the property type, and two
            tiles give Surface area and Number of rooms room for their labels. */}
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

      <DetailSection title={t('property.basicInfo')}>
        {hasRooms && (
          <DetailRow label={t('property.zipCode')} value={property.zip_code} />
        )}
        {property.property_owner != null && property.property_owner !== '' && (
          <DetailRow label={t('property.propertyOwner')} value={property.property_owner} />
        )}
        {property.block != null && property.block !== '' && (
          <DetailRow label={t('property.block')} value={property.block} />
        )}
        {property.plot != null && property.plot !== '' && (
          <DetailRow label={t('property.plot')} value={property.plot} />
        )}
      </DetailSection>

      <DetailSection title={t('property.details')}>
        {Array.isArray(property.parking_numbers) && property.parking_numbers.length > 0 && (
          <DetailRow
            label={t('property.parkingNumbers')}
            value={property.parking_numbers.join(', ')}
          />
        )}
        {property.property_tax != null && (
          <DetailRow
            label={t('property.propertyTax')}
            value={formatMoney(property.property_tax)}
          />
        )}
        {property.house_committee != null && (
          <DetailRow
            label={t('property.houseCommittee')}
            value={formatMoney(property.house_committee)}
          />
        )}
        {property.electricity_meter_number != null && property.electricity_meter_number !== '' && (
          <DetailRow
            label={t('property.electricityMeterNumber')}
            value={property.electricity_meter_number}
          />
        )}
        {property.electricity_account_number != null && property.electricity_account_number !== '' && (
          <DetailRow
            label={t('property.electricityAccountNumber')}
            value={property.electricity_account_number}
          />
        )}
        {property.water_meter_number != null && property.water_meter_number !== '' && (
          <DetailRow
            label={t('property.waterMeterNumber')}
            value={property.water_meter_number}
          />
        )}
        {property.water_account_number != null && property.water_account_number !== '' && (
          <DetailRow
            label={t('property.waterAccountNumber')}
            value={property.water_account_number}
          />
        )}
        {property.inventory_notes != null && property.inventory_notes !== '' && (
          <ExpandableNotesRow
            label={t('property.inventoryNotes')}
            value={property.inventory_notes}
            iconColor={colors.textSecondary}
            secondaryColor={colors.textSecondary}
          />
        )}
      </DetailSection>
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
  iconRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  notesRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
