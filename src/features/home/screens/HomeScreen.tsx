import React, { useCallback, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { PortfolioSection } from '@/src/features/home/components/PortfolioSection';
import { QuickActionsSection } from '@/src/features/home/components/QuickActionsSection';
import { NeedsAttentionSection } from '@/src/features/home/components/NeedsAttentionSection';
import { HomeReportsCard } from '@/src/features/home/components/HomeReportsCard';
import { RecentTransactionsSection } from '@/src/features/home/components/RecentTransactionsSection';
import { MOCK_PORTFOLIO } from '@/src/features/home/mock/homeMockData';
import { getTransactions } from '@/src/features/transactions/api/transactions';
import type { Transaction } from '@/src/shared/types';

function getGreetingWord() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function formatHeaderDate() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const month = now.toLocaleDateString('en-US', { month: 'long' });
  const date = now.getDate();
  return `${day} · ${month} ${date}`;
}

function GreetingHeader() {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { user } = useAppAuth();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? '';

  return (
    <View style={greetingStyles.container}>
      <Text style={[greetingStyles.greeting, { color: colors.textSecondary }]}>
        {`Good ${getGreetingWord()}${firstName ? `, ${firstName}` : ''}`}
      </Text>
      <Text style={[greetingStyles.date, { color: colors.textPrimary }]}>
        {formatHeaderDate()}
      </Text>
    </View>
  );
}

const greetingStyles = StyleSheet.create({
  container: {
    gap: 4,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '400',
  },
  date: {
    fontSize: 22,
    fontWeight: '700',
  },
});

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

  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const isFirstLoad = useRef(true);

  const fetchRecentTransactions = useCallback(async (silent = false) => {
    if (!silent) setTransactionsLoading(true);
    try {
      const data = await getTransactions({ limit: 5 });
      setRecentTransactions(data);
    } catch {
      // section stays empty on error
    } finally {
      if (!silent) setTransactionsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const silent = !isFirstLoad.current;
      isFirstLoad.current = false;
      fetchRecentTransactions(silent);
    }, [fetchRecentTransactions]),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <GreetingHeader />
        <QuickActionsSection />

        <NeedsAttentionSection />

        <PortfolioSection data={MOCK_PORTFOLIO} />

        <SectionLabel label={t('home.reports')} />
        <HomeReportsCard />

        {!transactionsLoading && (
          <>
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('home.recentTransactions')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>{t('home.viewAll')}</Text>
              </TouchableOpacity>
            </View>
            <RecentTransactionsSection items={recentTransactions} />
          </>
        )}
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
    gap: spacing.lg,
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
});
