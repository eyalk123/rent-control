import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Checkbox, Text, useTheme } from 'react-native-paper';
import { Icon } from '@/src/shared/components/ui';
import { useTranslation } from 'react-i18next';
import type { Renter } from '@/src/shared/types';
import { getLeaseEndDate } from '@/src/shared/types';
import { formatDateFull } from '@/src/shared/utils/dates';
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

  const leaseEndDate = getLeaseEndDate(renter);
  const isExpiringSoon = useMemo(() => {
    if (leaseEndDate == null) return false;
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return leaseEndDate <= threeMonthsFromNow;
  }, [leaseEndDate]);
  const leaseEndLabel = leaseEndDate
    ? t('renter.leaseEnd', { date: formatDateFull(leaseEndDate, language) })
    : null;

  return (
    <TouchableOpacity onPress={() => onPress(renter.id)} onLongPress={onLongPress ? () => onLongPress(renter.id) : undefined} activeOpacity={0.7}>
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.content}>
          {isSelectMode && (
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => onPress(renter.id)}
            />
          )}
          <RenterAvatar
            renter={renter}
            size={50}
            backgroundColor={colors.avatarBackground}
            textColor={colors.avatarText}
            style={[styles.avatar, { borderWidth: 1, borderColor: colors.avatarBorder }]}
          />
          <View style={styles.info}>
            <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
              {renter.first_name} {renter.last_name}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {renter.property ? `${renter.property.address}${formatFloorApartment(renter.property, t)}` : t('renter.unassigned')}
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.success }]}>
              <Text variant="labelSmall" style={[styles.badgeText, { color: colors.onPrimary }]}>
                {t('renter.status.active')}
              </Text>
            </View>
            {leaseEndLabel && (
              <Text
                variant="labelSmall"
                style={[
                  styles.leaseEndText,
                  { color: colors.textSecondary },
                  isExpiringSoon && { color: colors.accent, fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {leaseEndLabel}
              </Text>
            )}
          </View>
          {!isSelectMode && (
            <Icon
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  avatar: {
    marginEnd: 12
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    marginBottom: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
  },
  leaseEndText: {
    marginTop: 2,
    fontSize: 11,
  },
});
