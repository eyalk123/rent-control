/**
 * 6-month bar chart: per month, two thin bars side-by-side (revenue + expense).
 * The selected month renders at full opacity with a bold label and a subtle
 * highlight pill; other months dim to 33% to provide a "you are here" cue.
 * Tapping a month calls `onSelectMonth`.
 *
 * Bar heights are normalized to `max(revenue across all visible months)`.
 * Plain Views — no SVG / chart library dependency.
 */
import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { darkColors, lightColors, spacing, MAX_TIGHT_FONT_SCALE } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import {
  monthLabel,
  type MonthBucket,
} from '@/src/features/transactions/utils/aggregate';

const CHART_HEIGHT = 80;
const BAR_AREA_HEIGHT = 64;
const BAR_WIDTH = 8;
const MIN_BAR = 2;

// Varied heights give the ghost chart a realistic silhouette
const GHOST_BARS: [number, number][] = [
  [28, 40], [48, 20], [32, 52], [56, 36], [20, 44], [64, 28],
];

interface MonthsBarChartProps {
  buckets: MonthBucket[];
  selectedKey: string;
  onSelectMonth?: (key: string) => void;
  loading?: boolean;
  /** Message from a failed summary load. Shown in place of the bars. */
  error?: string | null;
  onRetry?: () => void;
}

export const MonthsBarChart = React.memo(function MonthsBarChart({ buckets, selectedKey, onSelectMonth, loading = false, error = null, onRetry }: MonthsBarChartProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { language } = useLanguageContext();
  const { t } = useTranslation();
  const locale = language === 'he' ? 'he-IL' : 'en-US';

  const shimmer = React.useRef(new Animated.Value(0.35)).current;
  React.useEffect(() => {
    if (!loading) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loading, shimmer]);

  if (loading) {
    const bg = colors.textSecondary;
    return (
      <Animated.View style={[styles.container, { opacity: shimmer }]}>
        <View style={styles.row}>
          {GHOST_BARS.map(([revH, expH], i) => (
            <View key={i} style={styles.column}>
              <View style={styles.barRow}>
                <View style={[styles.bar, { height: revH, backgroundColor: bg }]} />
                <View style={[styles.bar, { height: expH, backgroundColor: bg }]} />
              </View>
              <View style={[styles.ghostLabel, { backgroundColor: bg }]} />
            </View>
          ))}
        </View>
      </Animated.View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.messageBox]}>
        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
          {t(error, { defaultValue: error })}
        </Text>
        {onRetry ? (
          <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
            <Text style={[styles.retry, { color: colors.primary }]}>
              {t('common.tryAgain')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  const maxValue = buckets.reduce(
    (max, b) => Math.max(max, b.revenue, b.expenses),
    0,
  );
  const denom = maxValue > 0 ? maxValue : 1;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {buckets.map((b) => {
          const isSelected = b.key === selectedKey;
          const opacity = isSelected ? 1 : 0.33;
          const revH =
            b.revenue > 0
              ? Math.max(MIN_BAR, (b.revenue / denom) * BAR_AREA_HEIGHT)
              : 0;
          const expH =
            b.expenses > 0
              ? Math.max(MIN_BAR, (b.expenses / denom) * BAR_AREA_HEIGHT)
              : 0;

          const handlePress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelectMonth?.(b.key);
          };

          return (
            <Pressable
              key={b.key}
              onPress={handlePress}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={monthLabel(b.key, locale)}
              style={[
                styles.column,
                isSelected && { backgroundColor: colors.subtleOutline },
              ]}
            >
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
                maxFontSizeMultiplier={MAX_TIGHT_FONT_SCALE}
                style={[
                  styles.label,
                  {
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '400',
                    opacity: isSelected ? 1 : 0.8,
                  },
                ]}
              >
                {monthLabel(b.key, locale)}
              </Text>
            </Pressable>
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
    paddingVertical: 4,
    borderRadius: 10,
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
  messageBox: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
  },
  retry: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  ghostLabel: {
    height: 8,
    width: 24,
    borderRadius: 3,
    marginTop: 8,
  },
});
