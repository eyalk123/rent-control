import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, RadioButton, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '@/src/core/theme';
import { ScreenContainer } from '@/src/shared/components/ui';
import { getApiErrorMessage } from '@/src/core/api/client';
import { downloadIncomeExpenseReport } from '@/src/features/reports/api/reports';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

export function IncomeExpenseReportScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { year: yearParam } = useLocalSearchParams<{ year?: string }>();
  const [year, setYear] = useState(yearParam ? parseInt(yearParam, 10) : CURRENT_YEAR);
  const [format, setFormat] = useState<'pdf' | 'csv'>('pdf');
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      await downloadIncomeExpenseReport(year, format);
    } catch (err) {
      const msg = getApiErrorMessage(err, t('reports.exportError'));
      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Button icon="arrow-left" onPress={() => router.back()} mode="text" compact>
          {t('common.back')}
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          {t('reports.incomeExpense')}
        </Text>
        <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {t('reports.incomeExpenseDescription')}
        </Text>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          {t('reports.selectYear')}
        </Text>
        <View style={styles.yearGrid}>
          {YEAR_OPTIONS.map((y) => (
            <Button
              key={y}
              mode={year === y ? 'contained' : 'outlined'}
              onPress={() => setYear(y)}
              style={styles.yearButton}
              compact
            >
              {String(y)}
            </Button>
          ))}
        </View>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          {t('reports.format')}
        </Text>
        <SegmentedButtons
          value={format}
          onValueChange={(v) => setFormat(v as 'pdf' | 'csv')}
          buttons={[
            { value: 'pdf', label: 'PDF', icon: 'file-pdf-box' },
            { value: 'csv', label: 'CSV', icon: 'file-delimited' },
          ]}
          style={styles.segmented}
        />

        <Button
          mode="contained"
          onPress={handleExport}
          loading={loading}
          disabled={loading}
          icon="download"
          style={[styles.exportButton, { marginBottom: insets.bottom + spacing.lg }]}
          contentStyle={styles.exportButtonContent}
        >
          {loading ? t('reports.generating') : t('reports.export')}
        </Button>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  description: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  yearButton: {
    minWidth: 70,
  },
  segmented: {
    marginTop: spacing.xs,
  },
  exportButton: {
    marginTop: spacing.xl,
    borderRadius: 12,
  },
  exportButtonContent: {
    paddingVertical: spacing.sm,
  },
});
