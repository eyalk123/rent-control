import React, { useCallback, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { SkeletonBlock } from '@/src/shared/components/ui/SkeletonBlock';
import { SettingsGearButton } from '@/src/shared/components/ui/SettingsGearButton';
import { useShimmer } from '@/src/shared/hooks/useShimmer';
import { PortfolioSection } from '@/src/features/home/components/PortfolioSection';
import { QuickActionsSection } from '@/src/features/home/components/QuickActionsSection';
import { NeedsAttentionSection } from '@/src/features/home/components/NeedsAttentionSection';
import { HomeReportsCard } from '@/src/features/home/components/HomeReportsCard';
import { RecentTransactionsSection } from '@/src/features/home/components/RecentTransactionsSection';
import { getTransactions } from '@/src/features/transactions/api/transactions';
import type { Transaction } from '@/src/shared/types';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';

function getGreetingKey(): 'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

function formatHeaderDate(locale: string) {
  const now = new Date();
  const day = now.toLocaleDateString(locale, { weekday: 'long' });
  const month = now.toLocaleDateString(locale, { month: 'long' });
  const date = now.getDate();
  return `${day} · ${month} ${date}`;
}

function GreetingHeader() {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { user } = useAppAuth();
  const { t, i18n } = useTranslation();
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? '';
  const locale = i18n.language === 'he' ? 'he-IL' : 'en-US';

  return (
    <View style={greetingStyles.row}>
      <View style={greetingStyles.container}>
        <Text style={[greetingStyles.greeting, { color: colors.textSecondary }]}>
          {`${t(getGreetingKey())}${firstName ? `, ${firstName}` : ''}`}
        </Text>
        <Text style={[greetingStyles.date, { color: colors.textPrimary }]}>
          {formatHeaderDate(locale)}
        </Text>
      </View>
      <SettingsGearButton />
    </View>
  );
}

const greetingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
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
  // The `home` tour is requested by HomeTab, next to first-run and after it — see the note
  // there. Asking from here made this component's effect win the race and pushed the welcome
  // card to the back of the sweep.
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

  const txShimmer = useShimmer(transactionsLoading);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <GreetingHeader />
        <TourAnchor id={ANCHORS.homeQuickActions}>
          <QuickActionsSection />
        </TourAnchor>

        <NeedsAttentionSection />

        <TourAnchor id={ANCHORS.homePortfolio}>
          <PortfolioSection />
        </TourAnchor>

        <SectionLabel label={t('home.reports')} />
        <HomeReportsCard />

        <TourAnchor id={ANCHORS.homeRecent}>
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('home.recentTransactions')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')} disabled={transactionsLoading}>
            <Text style={[styles.viewAll, { color: colors.primary }]}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {transactionsLoading ? (
          <View style={[styles.skeletonCard, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}>
            {[0, 1, 2].map((i) => (
              <View key={i}>
                {i > 0 && <View style={[styles.skeletonDivider, { backgroundColor: colors.outline }]} />}
                <View style={styles.skeletonRow}>
                  <SkeletonBlock opacity={txShimmer} width={30} height={30} borderRadius={8} />
                  <View style={styles.skeletonInfo}>
                    <SkeletonBlock opacity={txShimmer} width="55%" height={13} borderRadius={4} />
                    <SkeletonBlock opacity={txShimmer} width="35%" height={11} borderRadius={4} style={{ marginTop: 4 }} />
                  </View>
                  <View style={styles.skeletonRight}>
                    <SkeletonBlock opacity={txShimmer} width={60} height={13} borderRadius={4} />
                    <SkeletonBlock opacity={txShimmer} width={40} height={11} borderRadius={4} style={{ marginTop: 4 }} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <RecentTransactionsSection items={recentTransactions} />
        )}
        </TourAnchor>
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
  skeletonCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  skeletonInfo: {
    flex: 1,
    gap: 0,
  },
  skeletonRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  skeletonDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -spacing.md,
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
