import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Checkbox, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import type { Renter } from '@/src/shared/types';
import { lightColors, darkColors } from '@/src/core/theme';
import { RenterAvatar } from '@/src/features/renters/components/RenterAvatar';

interface RenterCardProps {
  renter: Renter;
  onPress: () => void;
  onLongPress?: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
}

export function RenterCard({ renter, onPress, onLongPress, isSelectMode = false, isSelected = false }: RenterCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.content}>
          {isSelectMode && (
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={onPress}
            />
          )}
          <RenterAvatar renter={renter} size={40} style={styles.avatar} />
          <View style={styles.info}>
            <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
              {renter.first_name} {renter.last_name}
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              {renter.property?.address ?? t('renter.unassigned')}
            </Text>
            <View style={[styles.badge, { backgroundColor: colors.success }]}>
              <Text variant="labelSmall" style={styles.badgeText}>
                {t('renter.status.active')}
              </Text>
            </View>
          </View>
          {!isSelectMode && (
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

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
    marginEnd: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
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
    color: '#FFFFFF',
    fontSize: 11,
  },
});
