import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

/** The subtle "checking your data…" pill shown while the model runs a tool. */
export function ToolActivity({ name }: { name: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  return (
    <View
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={t([`agent.tool.${name}`, 'agent.tool.default'])}
      style={[
        styles.pill,
        { backgroundColor: theme.colors.surface, borderColor: colors.outline },
      ]}
    >
      <ActivityIndicator size={14} color={theme.colors.primary} />
      <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
        {t([`agent.tool.${name}`, 'agent.tool.default'])}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
