import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { spacing } from '@/src/core/theme';

const REPORT_KEYS = [
  'home.annualSummary',
  'home.expenseReport',
  'home.tenantReport',
  'home.taxReport',
] as const;

export function ReportsSection() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {REPORT_KEYS.map((key) => (
        <Chip
          key={key}
          mode="outlined"
          style={[styles.chip, { borderColor: theme.colors.outline }]}
          textStyle={styles.chipText}
          onPress={() => console.log(`[reports] ${key} coming soon`)}
        >
          {t(key)}
        </Chip>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
  },
});
