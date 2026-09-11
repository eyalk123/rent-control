import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { Property } from '@/src/shared/types';
import { lightColors, darkColors, spacing, ICON_SM } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import { Icon, StatBox, DetailRow, DetailSection, type IconName } from '@/src/shared/components/ui';

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

  /**
   * The tiles are the at-a-glance numbers: the first four of these that carry a value.
   *
   * Floor and apartment used to take the first row, but the screen title is built by
   * `formatPropertyAddress`, which appends ", Floor 3, Apartment 12" from the same two
   * fields using the same i18n keys - so those tiles repeated, word for word, the line
   * directly above them. Zip code used to appear here as a fallback when rooms were
   * missing; it is not a number anyone glances at, and it reads better in Basic
   * Information, where it now always sits.
   *
   * What replaced them is the money: property tax and house committee are the recurring
   * costs of holding the place, which is the kind of figure this app exists to surface.
   */
  const tiles: { key: string; icon: IconName; value: string; label: string }[] = [
    property.sq_ft > 0 && {
      key: 'sqFt',
      icon: 'ruler' as IconName,
      // The column is named sq_ft, but the entry form asks for "Size (m²)" / מ"ר - the
      // name is a legacy misnomer and the unit is metric.
      value: `${property.sq_ft.toLocaleString()} ${t('property.areaUnit')}`,
      label: t('property.surfaceArea'),
    },
    property.number_of_rooms != null && {
      key: 'rooms',
      icon: 'door-open' as IconName,
      value: String(property.number_of_rooms),
      label: t('property.numberOfRooms'),
    },
    property.property_tax != null && {
      key: 'propertyTax',
      icon: 'receipt' as IconName,
      value: formatMoney(property.property_tax),
      label: t('property.propertyTax'),
    },
    property.house_committee != null && {
      key: 'houseCommittee',
      icon: 'building' as IconName,
      value: formatMoney(property.house_committee),
      label: t('property.houseCommittee'),
    },
  ].filter(Boolean).slice(0, 4) as { key: string; icon: IconName; value: string; label: string }[];

  // Anything promoted to a tile is dropped from the rows below. The file already did this
  // for zip code; it just was not applied to anything else.
  const inTiles = new Set(tiles.map((tile) => tile.key));

  const tileRows = tiles.reduce<(typeof tiles)[]>((rows, tile, i) => {
    if (i % 2 === 0) rows.push([tile]);
    else rows[rows.length - 1].push(tile);
    return rows;
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {tileRows.map((row, i) => (
        <View key={i} style={styles.statsRow}>
          {row.map((tile) => (
            <StatBox
              key={tile.key}
              icon={tile.icon}
              value={tile.value}
              label={tile.label}
              backgroundColor={colors.inputBackground}
              // One colour across the set: these four tiles are peers, and the old mix of
              // primary / secondary / sectionAccent read as arbitrary rather than meaningful.
              iconColor={colors.primary}
              textColor={colors.textPrimary}
              secondaryColor={colors.textSecondary}
              valueVariant="titleMedium"
            />
          ))}
        </View>
      ))}

      <DetailSection title={t('property.basicInfo')}>
        <DetailRow label={t('property.zipCode')} value={property.zip_code} />
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
        {property.property_tax != null && !inTiles.has('propertyTax') && (
          <DetailRow
            label={t('property.propertyTax')}
            value={formatMoney(property.property_tax)}
          />
        )}
        {property.house_committee != null && !inTiles.has('houseCommittee') && (
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
