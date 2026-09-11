import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getCurrentMonthlyRent, type Property, type Transaction } from '@/src/shared/types';
import { getCurrentRenters } from '@/src/shared/utils/renterStatus';
import { effectiveDate } from '@/src/features/transactions/utils/aggregate';
import { lightColors, darkColors, spacing, ICON_SM } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import { Icon, StatBox, DetailRow, DetailSection, type IconName } from '@/src/shared/components/ui';

interface PropertyInfoTabProps {
  property: Property;
  /** Held by the screen so the Info and Transactions tabs share one fetch. */
  transactions: Transaction[];
  transactionsLoading: boolean;
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

export function PropertyInfoTab({ property, transactions, transactionsLoading }: PropertyInfoTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  /**
   * The tiles are the money, not the measurements.
   *
   * They used to be attributes of the building - floor, apartment, size, rooms - and two of
   * those repeated the screen title verbatim, because `formatPropertyAddress` builds it from
   * the same fields with the same i18n keys. The web app puts a KPI strip here instead, and
   * it is right: what an owner wants at a glance is what the place earns and costs, not how
   * many rooms it has. Size and rooms moved down to Basic Information, where they read as
   * the reference data they are.
   *
   * Totals cover the current calendar year and bucket by `effectiveDate` - the month the
   * rent is *for* on a revenue, the payment date on an expense - which is the same window
   * and the same rule the web strip uses, so the two apps quote the same number.
   */
  const currentYear = String(new Date().getFullYear());
  const { revTotal, expTotal } = React.useMemo(() => {
    let rev = 0;
    let exp = 0;
    for (const tx of transactions) {
      if (effectiveDate(tx).slice(0, 4) !== currentYear) continue;
      if (tx.type === 'revenue') rev += tx.amount;
      else exp += tx.amount;
    }
    return { revTotal: rev, expTotal: exp };
  }, [transactions, currentYear]);

  const monthlyRent = React.useMemo(() => {
    const current = getCurrentRenters(property.renters);
    if (!current.length) return null;
    return current.reduce((sum, r) => sum + getCurrentMonthlyRent(r), 0);
  }, [property.renters]);

  // An em dash while the fetch is in flight: StatBox has no loading state, and a flash of
  // 0 reads as "this property earned nothing", which is a different claim from "not yet known".
  const money = (n: number) => (transactionsLoading ? '—' : formatMoney(n));
  const net = revTotal - expTotal;

  const tiles: { key: string; icon: IconName; value: string; label: string; color?: string }[] = [
    {
      key: 'monthlyRent',
      icon: 'wallet' as IconName,
      value: monthlyRent != null ? formatMoney(monthlyRent) : '—',
      label: t('renter.monthlyRent'),
    },
    {
      key: 'net',
      icon: 'trending-up' as IconName,
      value: money(net),
      label: t('property.net', { year: currentYear }),
      color: transactionsLoading ? undefined : net >= 0 ? colors.revFg : colors.expFg,
    },
    {
      key: 'revenue',
      icon: 'arrow-up-right' as IconName,
      value: money(revTotal),
      label: t('property.totalRevenue', { year: currentYear }),
      color: transactionsLoading ? undefined : colors.revFg,
    },
    {
      key: 'expenses',
      icon: 'arrow-down-right' as IconName,
      value: money(expTotal),
      label: t('property.totalExpenses', { year: currentYear }),
      color: transactionsLoading ? undefined : colors.expFg,
    },
  ];

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
              iconColor={tile.color ?? colors.primary}
              textColor={tile.color ?? colors.textPrimary}
              secondaryColor={colors.textSecondary}
              valueVariant="titleMedium"
            />
          ))}
        </View>
      ))}

      <DetailSection title={t('property.basicInfo')}>
        <DetailRow
          label={t('property.surfaceArea')}
          value={`${property.sq_ft.toLocaleString()} ${t('property.areaUnit')}`}
        />
        {property.number_of_rooms != null && (
          <DetailRow
            label={t('property.numberOfRooms')}
            value={String(property.number_of_rooms)}
          />
        )}
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
