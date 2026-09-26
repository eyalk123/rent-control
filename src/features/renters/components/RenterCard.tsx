import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Checkbox, Text, useTheme } from 'react-native-paper';
import { ListCard, StatusPill } from '@/src/shared/components/ui';
import { useTranslation } from 'react-i18next';
import type { Renter } from '@/src/shared/types';
import { getLeaseEndDate } from '@/src/shared/types';
import { getEffectiveLeaseEnd, getRenterLifecycle, isOpenEnded } from '@/src/shared/utils/renterStatus';
import { formatDateFull, getLeaseUrgency } from '@/src/shared/utils/dates';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import { lightColors, darkColors } from '@/src/core/theme';
import { RenterAvatar } from '@/src/features/renters/components/RenterAvatar';

interface RenterCardProps {
  renter: Renter;
  onPress: (id: number) => void;
  onLongPress?: (id: number) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
}

export const RenterCard = React.memo(function RenterCard({ renter, onPress, onLongPress, isSelectMode = false, isSelected = false }: RenterCardProps) {
  const { t, i18n: { language } } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  // The badge used to be hard-coded green "Active" for every renter, including leases
  // that ran out years ago. It follows the lifecycle now.
  const lifecycle = getRenterLifecycle(renter);
  const ended = lifecycle === 'ended';
  const leaseEndDate = getEffectiveLeaseEnd(renter) ?? getLeaseEndDate(renter);
  // An open-ended lease has an end date, but the generator rolls it forward every year —
  // printing it would state an end the app invented and then quietly changed, and nothing
  // about a date that moves on its own is urgent.
  const openEnded = isOpenEnded(renter);
  const leaseUrgency = useMemo(
    () => getLeaseUrgency(openEnded ? null : leaseEndDate),
    [leaseEndDate, openEnded],
  );
  // The date alone: the caption above it says what it is, and without the "Lease ends:"
  // prefix it fits the narrow column at the end of the card.
  const leaseEndValue = openEnded
    ? t('renter.openEndedShort')
    : leaseEndDate
      ? formatDateFull(leaseEndDate, language)
      : null;
  // A lease that ran out on an ended tenancy is history, not a warning.
  const leaseEndColor = ended
    ? colors.textSecondary
    : leaseUrgency === 'expired'
      ? colors.error
      : leaseUrgency === 'soon'
        ? colors.accent
        : colors.textPrimary;

  return (
    <ListCard
      onPress={() => onPress(renter.id)}
      onLongPress={onLongPress ? () => onLongPress(renter.id) : undefined}
    >
      {isSelectMode && (
        <Checkbox
          status={isSelected ? 'checked' : 'unchecked'}
          onPress={() => onPress(renter.id)}
        />
      )}
      <RenterAvatar
        renter={renter}
        size={52}
        radius={12}
        backgroundColor={colors.primaryBg}
        textColor={colors.primary}
      />
      <View style={styles.info}>
        <Text variant="titleSmall" style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
          {renter.first_name} {renter.last_name}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: colors.textSecondary }}
          numberOfLines={1}
        >
          {renter.property ? `${renter.property.address}${formatFloorApartment(renter.property, t)}` : t('renter.unassigned')}
        </Text>
        {/* Only the exception gets a pill. An "Active" pill on every row of the Active tab
            said nothing the tab had not already said. */}
        {ended ? (
          <View style={styles.pillRow}>
            <StatusPill
              label={t('renter.status.ended')}
              backgroundColor={colors.outline}
              color={colors.textSecondary}
            />
          </View>
        ) : null}
      </View>
      {leaseEndValue && !isSelectMode ? (
        <View style={styles.trailing}>
          <Text
            variant="labelSmall"
            style={[styles.caption, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {t('renter.leaseEndsCaption')}
          </Text>
          <Text
            variant="labelLarge"
            style={[styles.leaseEndValue, { color: leaseEndColor }]}
            numberOfLines={1}
          >
            {leaseEndValue}
          </Text>
        </View>
      ) : null}
    </ListCard>
  );
});

const styles = StyleSheet.create({
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: 3,
  },
  trailing: {
    alignItems: 'flex-end',
    maxWidth: '38%',
    gap: 2,
  },
  caption: {
    fontSize: 11,
  },
  leaseEndValue: {
    fontWeight: '600',
  },
});
