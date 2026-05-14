import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Menu, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, FileBarChart2, MoreVertical, Receipt, RefreshCw, Share2, Trash2 } from 'lucide-react-native';

import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import { getApiErrorMessage } from '@/src/core/api/client';
import {
  deleteReportExport,
  downloadExpenseLogReport,
  downloadIncomeExpenseReport,
  getReportHistory,
  type ReportExport,
} from '@/src/features/reports/api/reports';

interface ReportCard {
  key: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
  route: string;
}

function SectionLabel({ label }: { label: string }) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  return (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
      {label}
    </Text>
  );
}

function GenerateCard({ card }: { card: ReportCard }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { isRtl } = useLanguageContext();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}
      onPress={() => router.push(card.route as any)}
      activeOpacity={0.7}
    >
      <View style={[styles.cardIconWrap, { backgroundColor: colors.primary + '14' }]}>
        {card.icon}
      </View>
      <View style={styles.cardBody}>
        <Text variant="titleSmall" style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {t(card.titleKey)}
        </Text>
        <Text variant="bodySmall" style={[styles.cardDesc, { color: colors.textSecondary }]}>
          {t(card.descriptionKey)}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textSecondary} style={{ transform: [{ scaleX: isRtl ? -1 : 1 }] }} />
    </TouchableOpacity>
  );
}

function HistoryRow({
  item,
  onDelete,
  onShare,
  onReexport,
}: {
  item: ReportExport;
  onDelete: (id: number) => void;
  onShare: (item: ReportExport) => void;
  onReexport: (item: ReportExport) => void;
}) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const typeName = item.report_type === 'income_expense'
    ? t('reports.incomeExpense')
    : t('reports.expenseLog');

  const date = new Date(item.created_at).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={[styles.historyRow, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}>
      <View style={[styles.formatBadge, { backgroundColor: colors.primary + '14' }]}>
        <Text style={[styles.formatText, { color: colors.primary }]}>
          {item.format.toUpperCase()}
        </Text>
      </View>
      <View style={styles.historyBody}>
        <Text variant="bodyMedium" style={[styles.historyTitle, { color: colors.textPrimary }]}>
          {typeName} {item.year}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
          {date}
        </Text>
      </View>
      <Menu
        visible={menuOpen}
        onDismiss={() => setMenuOpen(false)}
        anchor={
          <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={8} style={styles.menuAnchor}>
            {sharing
              ? <ActivityIndicator size={16} color={colors.textSecondary} />
              : <MoreVertical size={18} color={colors.textSecondary} />
            }
          </TouchableOpacity>
        }
      >
        <Menu.Item
          leadingIcon={() => <RefreshCw size={16} color={colors.textPrimary} />}
          onPress={() => { setMenuOpen(false); onReexport(item); }}
          title={t('reports.reexport')}
        />
        <Menu.Item
          leadingIcon={() => <Share2 size={16} color={colors.textPrimary} />}
          onPress={async () => {
            setMenuOpen(false);
            setSharing(true);
            try { await onShare(item); } finally { setSharing(false); }
          }}
          title={t('reports.shareAgain')}
        />
        <Menu.Item
          leadingIcon={() => <Trash2 size={16} color={colors.error} />}
          onPress={() => { setMenuOpen(false); onDelete(item.id); }}
          title={t('reports.delete')}
          titleStyle={{ color: theme.colors.error }}
        />
      </Menu>
    </View>
  );
}

function HistoryEmptyState() {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { t } = useTranslation();

  return (
    <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}>
      <FileBarChart2 size={32} color={colors.placeholder} />
      <Text variant="bodyMedium" style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        {t('reports.noHistory')}
      </Text>
      <Text variant="bodySmall" style={[styles.emptyDesc, { color: colors.placeholder }]}>
        {t('reports.noHistoryDescription')}
      </Text>
    </View>
  );
}

export function ReportsHubScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { isRtl } = useLanguageContext();

  const [history, setHistory] = useState<ReportExport[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      getReportHistory()
        .then((data) => { if (active) setHistory(data); })
        .catch(() => {})
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [])
  );

  async function handleDelete(id: number) {
    try {
      await deleteReportExport(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      alert(getApiErrorMessage(err, t('reports.deleteError')));
    }
  }

  async function handleShare(item: ReportExport) {
    try {
      if (item.report_type === 'income_expense') {
        await downloadIncomeExpenseReport(item.year, item.format);
      } else {
        await downloadExpenseLogReport(item.year, item.format);
      }
    } catch (err) {
      alert(getApiErrorMessage(err, t('reports.exportError')));
    }
  }

  function handleReexport(item: ReportExport) {
    const route = item.report_type === 'income_expense'
      ? `/reports/income-expense?year=${item.year}`
      : `/reports/expense-log?year=${item.year}`;
    router.push(route as any);
  }

  const cards: ReportCard[] = [
    {
      key: 'income-expense',
      titleKey: 'reports.incomeExpense',
      descriptionKey: 'reports.incomeExpenseDescription',
      icon: <FileBarChart2 size={22} color={colors.primary} />,
      route: '/reports/income-expense',
    },
    {
      key: 'expense-log',
      titleKey: 'reports.expenseLog',
      descriptionKey: 'reports.expenseLogDescription',
      icon: <Receipt size={22} color={colors.primary} />,
      route: '/reports/expense-log',
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.outline }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <ChevronRight
            size={22}
            color={colors.textPrimary}
            style={{ transform: [{ scaleX: isRtl ? 1 : -1 }] }}
          />
        </TouchableOpacity>
        <Text variant="titleLarge" style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('home.reports')}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionLabel label={t('reports.generate')} />
        <View style={styles.cardList}>
          {cards.map((card) => <GenerateCard key={card.key} card={card} />)}
        </View>

        <SectionLabel label={t('reports.history')} />
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : history.length === 0 ? (
          <HistoryEmptyState />
        ) : (
          <View style={styles.historyList}>
            {history.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onShare={handleShare}
                onReexport={handleReexport}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 32, alignItems: 'center' },
  headerTitle: { fontWeight: '700', flex: 1, textAlign: 'center' },
  content: { padding: spacing.lg, gap: spacing.md },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  cardList: { gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { fontWeight: '600' },
  cardDesc: { lineHeight: 17 },
  loader: { marginTop: spacing.xl },
  historyList: { gap: spacing.sm },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  formatBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 42,
    alignItems: 'center',
  },
  formatText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  historyBody: { flex: 1, gap: 2 },
  historyTitle: { fontWeight: '500' },
  menuAnchor: { padding: spacing.xs },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  emptyTitle: { fontWeight: '500' },
  emptyDesc: { textAlign: 'center', lineHeight: 18 },
});
