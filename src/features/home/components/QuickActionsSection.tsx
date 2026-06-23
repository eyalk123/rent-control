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
  showBadge?: boolean;
}

export function QuickActionsSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();

  const accentBg = theme.dark ? 'rgba(194,149,67,0.15)' : 'rgba(212,162,76,0.12)';

  // Fixed LTR order regardless of language: property, renter, transaction, supplier
  const actions: ActionButton[] = [
    {
      key: 'property',
      labelKey: 'home.addProperty',
      icon: 'home',
      iconColor: colors.accent,
      iconBg: accentBg,
      onPress: () => router.push('/properties/add'),
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
      key: 'transaction',
      labelKey: 'home.addTransaction',
      icon: 'arrow-right-left',
      iconColor: colors.accent,
      iconBg: accentBg,
      onPress: () => router.push('/transactions/add'),
    },
    {
      key: 'suppliers',
      labelKey: 'home.suppliers',
      icon: 'store',
      iconColor: colors.accent,
      iconBg: accentBg,
      showBadge: false,
      onPress: () => router.push('/transactions/suppliers' as any),
    },
  ];

  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={[styles.button, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outline }]}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconWrap, { backgroundColor: action.iconBg }]}>
            <Icon name={action.icon} size={ICON_MD} color={action.iconColor} />
          </View>
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {t(action.labelKey)}
          </Text>
          {action.showBadge !== false && (
            <View style={[styles.plusBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.plusText}>+</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    direction: 'ltr',
    gap: spacing.xs,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  plusBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 14,
  },
});
