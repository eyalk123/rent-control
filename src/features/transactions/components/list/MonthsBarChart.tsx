/**
 * 6-month bar chart: per month, two thin bars side-by-side (revenue + expense).
 * The current month renders at full opacity with a bold label; older months
 * dim to 33% to provide a "you are here" cue.
 *
 * Bar heights are normalized to `max(revenue across all visible months)`.
 * Plain Views — no SVG / chart library dependency.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import {
  monthLabel,
  type MonthBucket,
} from '@/src/features/transactions/utils/aggregate';

const CHART_HEIGHT = 80;
const BAR_AREA_HEIGHT = 64;
const BAR_WIDTH = 8;
const MIN_BAR = 2;

interface MonthsBarChartProps {
  buckets: MonthBucket[];
  currentKey: string;
}

export const MonthsBarChart = React.memo(function MonthsBarChart({ buckets, currentKey }: MonthsBarChartProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const maxValue = buckets.reduce(
    (max, b) => Math.max(max, b.revenue, b.expenses),
    0,
  );
  const denom = maxValue > 0 ? maxValue : 1;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {buckets.map((b) => {
          const isCurrent = b.key === currentKey;
          const opacity = isCurrent ? 1 : 0.33;
          const revH =
            b.revenue > 0
              ? Math.max(MIN_BAR, (b.revenue / denom) * BAR_AREA_HEIGHT)
              : 0;
          const expH =
            b.expenses > 0
              ? Math.max(MIN_BAR, (b.expenses / denom) * BAR_AREA_HEIGHT)
              : 0;

          return (
            <View key={b.key} style={styles.column}>
              <View style={styles.barRow}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: revH,
                      backgroundColor: colors.revFg,
                      opacity,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: expH,
                      backgroundColor: colors.expFg,
                      opacity,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isCurrent ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isCurrent ? '700' : '400',
                    opacity: isCurrent ? 1 : 0.8,
                  },
                ]}
              >
                {monthLabel(b.key, locale)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: CHART_HEIGHT + 16,
    paddingHorizontal: spacing.lg,
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  column: {
    alignItems: 'center',
    flex: 1,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: BAR_AREA_HEIGHT,
    gap: 2,
  },
  bar: {
    width: BAR_WIDTH,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  label: {
    fontSize: 11,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
});
