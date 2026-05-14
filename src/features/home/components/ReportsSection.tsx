import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';

export function ReportsSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { isRtl } = useLanguageContext();

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}
      onPress={() => router.push('/reports' as any)}
      activeOpacity={0.7}
    >
      <Text variant="bodyMedium" style={[styles.label, { color: colors.textPrimary }]}>
        {t('reports.viewAll')}
      </Text>
      <ChevronRight
        size={16}
        color={colors.textSecondary}
        style={{ transform: [{ scaleX: isRtl ? -1 : 1 }] }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontWeight: '500',
  },
});
