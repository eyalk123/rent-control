import { StyleSheet, View } from 'react-native';
import { Checkbox, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { getCurrentMonthlyRent, type Property, type Renter } from '@/src/shared/types';
import { RenterContractCard } from './RenterContractCard';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';

type PropertyGroup = {
  property: Property;
  renters: Renter[];
};

interface RenterSelectionSectionProps {
  filteredGroups: PropertyGroup[];
  allRenters: Renter[];
  checkedIds: Set<number>;
  amounts: Map<number, string>;
  overriddenIds: Set<number>;
  allChecked: boolean;
  someChecked: boolean;
  onToggleAll: () => void;
  onToggleRenter: (renter: Renter) => void;
  onAmountChange: (renterId: number, value: string) => void;
  onToggleOverride: (renterId: number, renter: Renter) => void;
}

export function RenterSelectionSection({
  filteredGroups,
  allRenters,
  checkedIds,
  amounts,
  overriddenIds,
  allChecked,
  someChecked,
  onToggleAll,
  onToggleRenter,
  onAmountChange,
  onToggleOverride,
}: RenterSelectionSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <>
      <Text
        variant="labelMedium"
        style={[styles.sectionSubLabel, { color: colors.textSecondary }]}
      >
        {t('transactions.bulkRevenue.tenantsSection', { defaultValue: 'Tenants' })}
      </Text>

      {filteredGroups.length === 0 ? (
        <Text
          variant="bodyMedium"
          style={[styles.emptyText, { color: colors.textSecondary }]}
        >
          {t('transactions.bulkRevenue.noContracts', { defaultValue: 'No contracts found.' })}
        </Text>
      ) : (
        <>
          {allRenters.length > 0 && (
            <View style={styles.selectAllRow}>
              <Checkbox
                status={allChecked ? 'checked' : someChecked ? 'indeterminate' : 'unchecked'}
                onPress={onToggleAll}
              />
              <Text
                variant="bodyMedium"
                style={[styles.selectAllLabel, { color: colors.textPrimary }]}
              >
                {t('transactions.bulkRevenue.selectAll', { defaultValue: 'Select all' })}
              </Text>
              <View style={styles.spacer} />
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {t('transactions.bulkRevenue.selectedCount', {
                  count: checkedIds.size,
                  defaultValue: '{{count}} selected',
                })}
              </Text>
            </View>
          )}

          {filteredGroups.map((group) => (
            <View key={group.property.id} style={styles.propertyGroup}>
              <View style={styles.propertyHeaderRow}>
                <View
                  style={[styles.propertyAccent, { backgroundColor: colors.sectionAccent }]}
                />
                <Text
                  variant="titleMedium"
                  style={[styles.propertyHeaderText, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {group.property.address}{formatFloorApartment(group.property, t)}
                  {group.property.city ? `, ${group.property.city}` : ''}
                </Text>
              </View>
              {group.renters.map((renter) => (
                <RenterContractCard
                  key={renter.id}
                  renter={renter}
                  checked={checkedIds.has(renter.id)}
                  amount={amounts.get(renter.id) ?? String(getCurrentMonthlyRent(renter) || '')}
                  overridden={overriddenIds.has(renter.id)}
                  onToggle={() => onToggleRenter(renter)}
                  onAmountChange={(v) => onAmountChange(renter.id, v)}
                  onToggleOverride={() => onToggleOverride(renter.id, renter)}
                />
              ))}
            </View>
          ))}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionSubLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 11,
    marginBottom: spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  selectAllLabel: {
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  propertyGroup: {
    marginBottom: spacing.lg,
  },
  propertyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm + 2,
  },
  propertyAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  propertyHeaderText: {
    fontWeight: '700',
    flex: 1,
  },
});
