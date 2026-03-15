import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'react-native-paper';
import type { Renter } from '@/src/shared/types';
import { lightColors, darkColors } from '@/src/core/theme';

interface RenterCardProps {
  renter: Renter;
  onPress: () => void;
}

export function RenterCard({ renter, onPress }: RenterCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card} mode="outlined">
        <Card.Content style={styles.content}>
          <View
            style={[styles.avatar, { backgroundColor: colors.inputBackground }]}
          >
            <Text variant="labelLarge" style={{ color: colors.textSecondary }}>
              {renter.first_name[0]}
              {renter.last_name[0]}
            </Text>
          </View>
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
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={colors.textSecondary}
          />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
