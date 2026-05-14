import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter, type Href } from 'expo-router';
import { spacing } from '@/src/core/theme';

const REPORTS = [
  { key: 'reports.incomeExpense', route: '/reports/income-expense' },
  { key: 'reports.expenseLog', route: '/reports/expense-log' },
] as const;

export function ReportsSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {REPORTS.map(({ key, route }) => (
        <Chip
          key={key}
          mode="outlined"
          style={[styles.chip, { borderColor: theme.colors.outline }]}
          textStyle={styles.chipText}
          onPress={() => router.push(route as Href)}
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
