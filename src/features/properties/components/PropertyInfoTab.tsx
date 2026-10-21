import React from 'react';
import { formatArea } from '@/src/shared/utils/money';
import { registryKey1, registryKey2 } from '@/src/shared/utils/registryLabels';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import {
  getCurrentMonthlyRent,
  type Property,
  type PropertyValuationInput,
  type Renter,
  type Transaction,
} from '@/src/shared/types';
import { getCurrentRenters } from '@/src/shared/utils/renterStatus';
import { effectiveDate } from '@/src/features/transactions/utils/aggregate';
import { lightColors, darkColors, spacing, ICON_SM, useEntityColor } from '@/src/core/theme';
import { useRouter } from 'expo-router';
import { RenterAvatar } from '@/src/features/renters/components/RenterAvatar';
import { formatDate, formatMoney } from '@/src/shared/utils/money';
import { useAlert } from '@/src/core/context';
import { getApiErrorMessage } from '@/src/core/api/client';
import { createPropertyValuation, getPropertyById } from '@/src/features/properties/api/properties';
import { PropertyValueDialog } from '@/src/features/properties/components/PropertyValueDialog';
import { PropertyValueHistoryDialog } from '@/src/features/properties/components/PropertyValueHistoryDialog';
import { formatPercent, formatWholeMoney } from '@/src/features/properties/utils/propertyReturns';
import { Icon, StatBox, DetailRow, DetailSection, InfoTipText, SectionLabel, type IconName } from '@/src/shared/components/ui';
import { MortgageSection } from '@/src/features/properties/components/MortgageSection';
import { capabilities } from '@/src/shared/utils/capabilities';

interface PropertyInfoTabProps {
  property: Property;
  /** Held by the screen so the Info and Transactions tabs share one fetch. */
  transactions: Transaction[];
  transactionsLoading: boolean;
  /** Replaces the screen's copy after a value is added or removed. */
  onPropertyChange: (property: Property) => void;
}

/**
 * Who lives here, as tiles in each renter's own color - the same mark the renter screen and
 * the Renters list use, so a face here is recognisable there. Tapping one opens the renter.
 */
function RentersHereSection({ renters }: { renters: Renter[] }) {
  const { t } = useTranslation();
  if (renters.length === 0) return null;
  return (
    <View style={styles.rentersHere}>
      <SectionLabel title={t('property.rentersHere')} />
      <View style={styles.renterTiles}>
        {renters.map((r) => (
          <RenterTile key={r.id} renter={r} />
        ))}
      </View>
    </View>
  );
}

function RenterTile({ renter }: { renter: Renter }) {
  const router = useRouter();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const itemColor = useEntityColor(renter.color);
  const name = `${renter.first_name} ${renter.last_name}`.trim();
  return (
    <TouchableOpacity
      onPress={() => router.push(`/renters/${renter.id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={[styles.renterTile, { backgroundColor: colors.surface, borderColor: colors.outline }]}
    >
      <RenterAvatar
        renter={renter}
        size={36}
        radius={10}
        backgroundColor={itemColor.bg}
        textColor={itemColor.fg}
      />
      <View style={styles.renterTileText}>
        <Text variant="bodyMedium" numberOfLines={1} style={[styles.renterName, { color: colors.textPrimary }]}>
          {name}
        </Text>
        <Text variant="labelSmall" numberOfLines={1} style={{ color: colors.textSecondary }}>
          {formatMoney(getCurrentMonthlyRent(renter))}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// The section above names it, so the row is just the text.
function ExpandableNotesRow({ value, toggleColor }: { value: string; toggleColor: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);
  return (
    <View style={styles.notesRow}>
      <Text
        variant="bodyMedium"
        numberOfLines={expanded ? undefined : 2}
        style={styles.notesText}
      >
        {value}
      </Text>
      <TouchableOpacity onPress={() => setExpanded((v) => !v)}>
        <Text variant="labelSmall" style={[styles.notesToggle, { color: toggleColor }]}>
          {expanded ? t('common.showLess') : t('common.showMore')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function PropertyInfoTab({
  property,
  transactions,
  transactionsLoading,
  onPropertyChange,
}: PropertyInfoTabProps) {
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
  const money = (n: number) => (transactionsLoading ? '–' : formatMoney(n));
  const net = revTotal - expTotal;

  const tiles: { key: string; icon: IconName; value: string; label: string; color?: string }[] = [
    {
      key: 'monthlyRent',
      icon: 'wallet' as IconName,
      value: monthlyRent != null ? formatMoney(monthlyRent) : '–',
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
      // Isolated left-to-right, or Hebrew moves the sign to the far end of the figure.
      value: transactionsLoading ? '–' : `⁦+${formatMoney(revTotal)}⁩`,
      label: t('property.totalRevenue', { year: currentYear }),
      color: transactionsLoading ? undefined : colors.revFg,
    },
    {
      key: 'expenses',
      icon: 'arrow-down-right' as IconName,
      value: transactionsLoading ? '–' : `⁦−${formatMoney(expTotal)}⁩`,
      label: t('property.totalExpenses', { year: currentYear }),
      color: transactionsLoading ? undefined : colors.expFg,
    },
  ];
  // Beside the yearly net, never instead of it. The server sends it only for a property
  // with a mortgage and a tenant. A computed average, so whole units.
  const monthlyLeft = property.returns?.monthly_left ?? null;
  if (monthlyLeft != null) {
    tiles.push({
      key: 'left',
      icon: 'wallet' as IconName,
      value: formatWholeMoney(monthlyLeft),
      label: t('mortgage.left'),
      color: monthlyLeft >= 0 ? colors.revFg : colors.expFg,
    });
  }

  const currentRenters = React.useMemo(() => getCurrentRenters(property.renters), [property.renters]);
  const [metersOpen, setMetersOpen] = React.useState(false);
  const meters = [
    { label: t('property.electricityMeterNumber'), value: property.electricity_meter_number },
    { label: t('property.electricityAccountNumber'), value: property.electricity_account_number },
    { label: t('property.waterMeterNumber'), value: property.water_meter_number },
    { label: t('property.waterAccountNumber'), value: property.water_account_number },
  ].filter((m): m is { label: string; value: string } => m.value != null && m.value !== '');

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
            // No icon since the color redesign: the colored figure and its label carry it,
            // and four glyphs over four numbers were the busiest thing on the screen.
            <StatBox
              key={tile.key}
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

      <RentersHereSection renters={currentRenters} />

      <DetailSection title={t('property.sectionProperty')}>
        <DetailRow
          label={t('property.surfaceArea')}
          value={formatArea(property.sq_ft)}
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
          <DetailRow label={t(registryKey1())} value={property.block} />
        )}
        {property.plot != null && property.plot !== '' && (
          <DetailRow label={t(registryKey2() ?? 'property.plot')} value={property.plot} />
        )}
      </DetailSection>

      <PurchaseAndValueSection property={property} onPropertyChange={onPropertyChange} />

      {capabilities().mortgage && property.mortgage && (
        <MortgageSection
          property={property}
          mortgage={property.mortgage}
          onPropertyChange={onPropertyChange}
        />
      )}

      <DetailSection title={t('property.billsAndFees')}>
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
        {Array.isArray(property.parking_numbers) && property.parking_numbers.length > 0 && (
          <DetailRow
            label={t('property.parkingNumbers')}
            value={property.parking_numbers.join(', ')}
          />
        )}
        {meters.length > 0 && (
          <DetailRow
            label={t('property.metersAndAccounts')}
            onPress={() => setMetersOpen((v) => !v)}
            accessibilityLabel={`${t('property.metersAndAccounts')}, ${t('property.metersSummary')}`}
          >
            <View style={styles.metersCell}>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {t('property.metersSummary')}
              </Text>
              <Icon
                name={metersOpen ? 'chevron-up' : 'chevron-down'}
                size={ICON_SM}
                color={colors.textSecondary}
              />
            </View>
          </DetailRow>
        )}
        {/* Four long numbers that are rarely read twice: folded until asked for. */}
        {metersOpen &&
          meters.map((m) => <DetailRow key={m.label} label={m.label} value={m.value} />)}
      </DetailSection>

      {property.inventory_notes != null && property.inventory_notes !== '' && (
        <DetailSection title={t('property.inventoryNotes')}>
          <ExpandableNotesRow value={property.inventory_notes} toggleColor={colors.primary} />
        </DetailSection>
      )}
    </ScrollView>
  );
}

/**
 * What was paid and what it is worth now. The current value is the latest entry of the value
 * history: "+" adds one straight away (the same dialog as the form's), History lists them.
 */
function PurchaseAndValueSection({
  property,
  onPropertyChange,
}: Pick<PropertyInfoTabProps, 'property' | 'onPropertyChange'>) {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [addOpen, setAddOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  // Computed by the server — the same figures the assistant quotes.
  const returns = property.returns;

  // Re-read rather than patched locally: the server decides which entry is current (the
  // latest by date, which a backdated entry is not).
  const refresh = React.useCallback(async () => {
    try {
      onPropertyChange(await getPropertyById(property.id));
    } catch {
      // The value was saved; the screen catches up on its next focus.
    }
  }, [property.id, onPropertyChange]);

  const add = async (valuation: PropertyValuationInput) => {
    setSaving(true);
    try {
      await createPropertyValuation(property.id, valuation);
      setAddOpen(false);
      await refresh();
    } catch (err) {
      appAlert(t('error.title'), getApiErrorMessage(err, t('property.valueSaveFailed')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DetailSection
        title={t('property.valueSection')}
        action={
          <IconButton
            mode="contained"
            size={18}
            containerColor={colors.primary}
            icon={() => <Icon name="plus" size={ICON_SM} color={colors.onPrimary} />}
            onPress={() => setAddOpen(true)}
            accessibilityLabel={t('property.addValue')}
            style={styles.addButton}
          />
        }
      >
        {property.purchase_price != null && (
          <DetailRow label={t('property.purchasePrice')} value={formatMoney(property.purchase_price)} />
        )}
        {property.purchase_date ? (
          <DetailRow label={t('property.purchaseDate')} value={formatDate(property.purchase_date)} />
        ) : null}
        <DetailRow label={t('property.currentValue')} info={t('property.info.currentValue')}>
          <View style={styles.valueCell}>
            <Text variant="bodyMedium" style={[styles.valueAmount, { color: colors.textPrimary }]}>
              {property.current_value != null ? formatMoney(property.current_value) : '–'}
            </Text>
            {property.current_value_date ? (
              <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                {t('property.valueAsOf', { date: formatDate(property.current_value_date) })}
              </Text>
            ) : null}
          </View>
        </DetailRow>
        {/* Neutral ink throughout: a yield or a change in value is a fact, not an alarm. */}
        {returns?.gross_yield != null && (
          <DetailRow
            label={t('property.grossYield')}
            value={formatPercent(returns.gross_yield)}
            info={
              <>
                <InfoTipText>{t('property.info.grossYield')}</InfoTipText>
                <InfoTipText secondary>{t('property.info.grossYieldExample')}</InfoTipText>
              </>
            }
          />
        )}
        {returns?.net_yield != null && (
          <DetailRow label={t('property.netYield')} value={formatPercent(returns.net_yield)} info={t('property.info.netYield')} />
        )}
        {returns?.appreciation != null && returns.appreciation_pct != null && (
          <DetailRow
            label={t('property.appreciation')}
            info={
              <>
                <InfoTipText>{t('property.info.appreciation')}</InfoTipText>
                <InfoTipText secondary>{t('property.info.appreciationPerYear')}</InfoTipText>
              </>
            }
          >
            <View style={styles.valueCell}>
              <Text variant="bodyMedium" style={[styles.valueAmount, { color: colors.textPrimary }]}>
                {/* Isolated left-to-right, or a Hebrew line moves the sign and brackets to the far end. */}
                {`⁦${returns.appreciation > 0 ? '+' : ''}${formatMoney(returns.appreciation)} (${formatPercent(returns.appreciation_pct, true)})⁩`}
              </Text>
              {returns.appreciation_per_year != null ? (
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('property.appreciationPerYear', { pct: formatPercent(returns.appreciation_per_year, true) })}
                </Text>
              ) : null}
            </View>
          </DetailRow>
        )}
        {property.current_value != null && (
          <Button
            mode="text"
            compact
            icon={() => <Icon name="clock" size={ICON_SM} color={colors.primary} />}
            onPress={() => setHistoryOpen(true)}
            style={styles.historyButton}
          >
            {t('property.valueHistory')}
          </Button>
        )}
      </DetailSection>
      <PropertyValueDialog
        visible={addOpen}
        loading={saving}
        onConfirm={add}
        onDismiss={() => setAddOpen(false)}
      />
      <PropertyValueHistoryDialog
        visible={historyOpen}
        propertyId={property.id}
        purchasePrice={property.purchase_price}
        purchaseDate={property.purchase_date}
        onDismiss={() => setHistoryOpen(false)}
        onChanged={refresh}
      />
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    margin: 0,
  },
  valueCell: {
    alignItems: 'flex-end',
  },
  valueAmount: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  historyButton: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metersCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rentersHere: {
    marginBottom: spacing.lg,
  },
  renterTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  // Two to a row; a lone renter takes the full width.
  renterTile: {
    flexGrow: 1,
    flexBasis: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  renterTileText: {
    flex: 1,
    minWidth: 0,
  },
  renterName: {
    fontWeight: '500',
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
