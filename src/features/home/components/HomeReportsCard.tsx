import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import FileBarChart2 from 'lucide-react-native/icons/file-chart-column';
import Plus from 'lucide-react-native/icons/plus';
import Receipt from 'lucide-react-native/icons/receipt';
import Share2 from 'lucide-react-native/icons/share-2';

import { darkColors, lightColors } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import { formatDateShort } from '@/src/shared/utils/dates';
import { SkeletonBlock } from '@/src/shared/components/ui/SkeletonBlock';
import { useShimmer } from '@/src/shared/hooks/useShimmer';
import {
  downloadExpenseLogReport,
  downloadIncomeExpenseReport,
  getReportHistory,
  type ReportExport,
} from '@/src/features/reports/api/reports';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';

export function HomeReportsCard() {
  // Reports are seeded from Home rather than from first-run: on day one there is nothing
  // to report on, so the sentence would mean nothing.
  const anchorRef = useTourAnchor(ANCHORS.homeReportsCard);
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const { isRtl } = useLanguageContext();

  const [lastReport, setLastReport] = useState<ReportExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const shimmer = useShimmer(loading);

  useEffect(() => {
    getReportHistory()
      .then((data) => setLastReport(data[0] ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleShare() {
    if (!lastReport) return;
    setSharing(true);
    try {
      if (lastReport.report_type === 'income_expense') {
        await downloadIncomeExpenseReport(lastReport.year, lastReport.format);
      } else {
        await downloadExpenseLogReport(lastReport.year, lastReport.format);
      }
    } finally {
      setSharing(false);
    }
  }

  if (loading) {
    return (
      <View ref={anchorRef} collapsable={false} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}>
        <View style={styles.topRow}>
          <SkeletonBlock opacity={shimmer} width={38} height={38} borderRadius={10} />
          <View style={[styles.body, { gap: 6 }]}>
            <SkeletonBlock opacity={shimmer} width="55%" height={13} borderRadius={4} />
            <SkeletonBlock opacity={shimmer} width="35%" height={11} borderRadius={4} />
          </View>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.dark ? 'rgba(241,236,223,0.06)' : 'rgba(22,41,74,0.06)' }]} />
        <View style={[styles.generateRow, { opacity: 0.4 }]}>
          <Plus size={14} color={colors.primary} strokeWidth={2} />
          <Text style={[styles.generateLabel, { color: colors.primary }]}>
            {t('home.reportGenerateNew')}
          </Text>
          <ChevronRight size={13} color={colors.textSecondary} style={styles.chevron} />
        </View>
      </View>
    );
  }

  const isExpenseLog = lastReport?.report_type === 'expense_log';
  const iconBg = lastReport
    ? (isExpenseLog ? colors.expBg : colors.revBg)
    : (theme.dark ? 'rgba(62,111,168,0.12)' : 'rgba(22,41,74,0.07)');
  const iconColor = lastReport
    ? (isExpenseLog ? colors.expFg : colors.revFg)
    : colors.primary;
  const IconComp = isExpenseLog ? Receipt : FileBarChart2;

  const reportName = lastReport
    ? `${lastReport.report_type === 'income_expense' ? t('reports.incomeExpense') : t('reports.expenseLog')} ${lastReport.year}`
    : t('home.reportEmptyTitle');

  const dateMeta = lastReport
    ? formatDateShort(new Date(lastReport.created_at), i18n.language)
    : null;

  return (
    <View ref={anchorRef} collapsable={false} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.iconTile, { backgroundColor: iconBg }]}>
          <IconComp size={18} color={iconColor} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {reportName}
          </Text>
          {lastReport && dateMeta ? (
            <View style={styles.metaRow}>
              <View style={[styles.pdfTag, { backgroundColor: theme.dark ? 'rgba(241,236,223,0.10)' : 'rgba(26,45,74,0.08)' }]}>
                <Text style={[styles.pdfTagText, { color: colors.primary }]}>
                  {lastReport.format.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {dateMeta}
              </Text>
            </View>
          ) : (
            <Text style={[styles.metaText, { color: colors.placeholder }]}>
              {t('home.reportEmptyMeta')}
            </Text>
          )}
        </View>

        {lastReport && (
          <TouchableOpacity
            style={[styles.shareBtn, { borderColor: 'rgba(203,213,225,1)' }]}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            {sharing ? (
              <ActivityIndicator size={12} color={colors.primary} />
            ) : (
              <>
                <Share2 size={13} color={colors.primary} />
                <Text style={[styles.shareLabel, { color: colors.primary }]}>
                  {t('home.reportShare')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.dark ? 'rgba(241,236,223,0.06)' : 'rgba(22,41,74,0.06)' }]} />

      {/* Generate new row */}
      <TouchableOpacity
        style={styles.generateRow}
        onPress={() => router.push('/reports' as any)}
        activeOpacity={0.7}
      >
        <Plus size={14} color={colors.primary} strokeWidth={2} />
        <Text style={[styles.generateLabel, { color: colors.primary }]}>
          {t('home.reportGenerateNew')}
        </Text>
        <ChevronRight
          size={13}
          color={colors.textSecondary}
          style={[styles.chevron, { transform: [{ scaleX: isRtl ? -1 : 1 }] }]}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pdfTag: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  pdfTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaText: {
    fontSize: 11,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexShrink: 0,
  },
  shareLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 10,
    marginHorizontal: -14,
  },
  generateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
  },
  generateLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  chevron: {
    flexShrink: 0,
  },
});
