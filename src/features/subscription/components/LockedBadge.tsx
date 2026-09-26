import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';

/**
 * The marker on a property the plan no longer covers.
 *
 * A locked property cannot be opened: the list shows it as a stub and every other read
 * is refused. Nothing is deleted, though, and the account export still includes it — the
 * over-limit notice says so, so the badge itself can stay one word.
 */
export function LockedBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: colors.inputFilledBackground, borderColor: colors.outline },
      ]}
      accessibilityRole="text"
      accessibilityLabel={t('subscription.locked')}
    >
      <Icon name="lock" size={compact ? 10 : 12} color={colors.textSecondary} />
      <Text
        variant="labelSmall"
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: colors.textSecondary },
        ]}
      >
        {t('subscription.locked')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeCompact: { paddingHorizontal: 6, paddingVertical: 2 },
  label: { fontSize: 11, lineHeight: 14 },
  labelCompact: { fontSize: 10, lineHeight: 13 },
});
