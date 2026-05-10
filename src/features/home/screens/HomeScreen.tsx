import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { PortfolioSection } from '@/src/features/home/components/PortfolioSection';
import { QuickActionsSection } from '@/src/features/home/components/QuickActionsSection';
import { ExpiringLeasesCard } from '@/src/features/home/components/ExpiringLeasesCard';
import { OverdueRentsCard } from '@/src/features/home/components/OverdueRentsCard';
import { ReportsSection } from '@/src/features/home/components/ReportsSection';
import { RecentTransactionsSection } from '@/src/features/home/components/RecentTransactionsSection';
import {
  MOCK_PORTFOLIO,
  MOCK_EXPIRING,
  MOCK_RECENT_TRANSACTIONS,
} from '@/src/features/home/mock/homeMockData';

function SectionLabel({ label }: { label: string }) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  return (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{label}</Text>
  );
}

export function HomeScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PortfolioSection data={MOCK_PORTFOLIO} />

        <SectionLabel label={t('home.quickActions')} />
        <QuickActionsSection />

        <View style={[styles.alertsRow, { marginTop: spacing.sm }]}>
          <ExpiringLeasesCard items={MOCK_EXPIRING} />
          <OverdueRentsCard />
        </View>

        <SectionLabel label={t('home.reports')} />
        <ReportsSection />

        <View style={styles.recentHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('home.recentTransactions')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        <RecentTransactionsSection items={MOCK_RECENT_TRANSACTIONS} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: 2,
  },
  alertsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
