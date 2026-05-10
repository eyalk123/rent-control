import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { darkColors, ICON_MD, lightColors, spacing } from '@/src/core/theme';
import { Icon, type IconName } from '@/src/shared/components/ui/Icon';

interface ActionButton {
  key: string;
  labelKey: string;
  icon: IconName;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
}

export function QuickActionsSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();

  const accentBg = theme.dark ? 'rgba(194,149,67,0.15)' : 'rgba(212,162,76,0.12)';

  const actions: ActionButton[] = [
    {
      key: 'revenue',
      labelKey: 'home.addRevenue',
      icon: 'arrow-up-right',
      iconColor: colors.revFg,
      iconBg: colors.revBg,
      onPress: () => router.push('/transactions/add?type=revenue'),
    },
    {
      key: 'expense',
      labelKey: 'home.addExpense',
      icon: 'arrow-down-right',
      iconColor: colors.expFg,
      iconBg: colors.expBg,
      onPress: () => router.push('/transactions/add?type=expense'),
    },
    {
      key: 'renter',
      labelKey: 'home.addRenter',
      icon: 'user',
      iconColor: colors.accent,
      iconBg: accentBg,
      onPress: () => router.push('/renters/add'),
    },
    {
      key: 'property',
      labelKey: 'home.addProperty',
      icon: 'home',
      iconColor: colors.accent,
      iconBg: accentBg,
      onPress: () => router.push('/properties/add'),
    },
  ];

  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={[styles.button, { backgroundColor: theme.colors.surface }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: action.iconBg }]}>
            <Icon name={action.icon} size={ICON_MD} color={action.iconColor} />
          </View>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {t(action.labelKey)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  button: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
});
