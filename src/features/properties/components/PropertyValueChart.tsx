import React, { useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { currencySymbol } from '@/src/shared/utils/money';
import { parseISODate } from '@/src/shared/utils/dates';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import type { PropertyValuation } from '@/src/shared/types';

interface Props {
  /** Newest first, as the API returns them. */
  valuations: PropertyValuation[];
  purchasePrice?: number | null;
  purchaseDate?: string | null;
}

const HEIGHT = 160;
const PAD = { top: 12, right: 12, bottom: 22, left: 48 };
const TARGET_TICKS = 4;

/** A round step (1, 2 or 5 × a power of ten) that gives about `TARGET_TICKS` gridlines. */
function niceStep(range: number): number {
  const raw = range / TARGET_TICKS;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function compact(v: number): string {
  const s = currencySymbol();
  if (Math.abs(v) >= 1_000_000) return `${s}${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `${s}${Math.round(v / 1000)}k`;
  return `${s}${v}`;
}

/**
 * The property's value over time — one series, so no legend; the list under it is the table
 * view. Dates sit on a real time scale, so a ten-year gap reads as one. Always drawn
 * left-to-right: time runs that way in Hebrew charts too.
 */
export function PropertyValueChart({ valuations, purchasePrice, purchaseDate }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [width, setWidth] = useState(0);

  const points = valuations.map((v) => ({ t: parseISODate(v.valued_on)?.getTime() ?? 0, value: v.value }));
  if (purchasePrice && purchaseDate) {
    points.push({ t: parseISODate(purchaseDate)?.getTime() ?? 0, value: purchasePrice });
  }
  points.sort((a, b) => a.t - b.t);
  if (points.length < 2) return null;

  const tMin = points[0].t;
  const tMax = points[points.length - 1].t;
  const values = points.map((p) => p.value);
  let vMin = Math.min(...values);
  let vMax = Math.max(...values);
  // Breathing room above and below, and a usable range when every value is the same.
  const span = vMax - vMin || vMax * 0.1 || 1;
  vMin -= span * 0.15;
  vMax += span * 0.15;

  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (tv: number) => PAD.left + (tMax === tMin ? plotW / 2 : ((tv - tMin) / (tMax - tMin)) * plotW);
  const y = (v: number) => PAD.top + (1 - (v - vMin) / (vMax - vMin)) * plotH;

  // Gridlines on round values, so a label always names the value its line is drawn at.
  const step = niceStep(vMax - vMin);
  const ticks: number[] = [];
  for (let v = Math.ceil(vMin / step) * step; v <= vMax; v += step) ticks.push(v);

  const firstYear = new Date(tMin).getFullYear();
  const lastYear = new Date(tMax).getFullYear();

  return (
    <View
      style={{ marginBottom: spacing.sm }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityLabel={t('property.valueChartLabel')}
    >
      {width > 0 ? (
        <Svg width={width} height={HEIGHT}>
          {ticks.map((v, i) => {
            return (
              <React.Fragment key={i}>
                <Line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke={colors.inputBorder}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <SvgText x={PAD.left - 6} y={y(v) + 4} fontSize={10} fill={colors.textSecondary} textAnchor="end">
                  {compact(v)}
                </SvgText>
              </React.Fragment>
            );
          })}
          <SvgText x={PAD.left} y={HEIGHT - 6} fontSize={10} fill={colors.textSecondary} textAnchor="start">
            {String(firstYear)}
          </SvgText>
          {lastYear !== firstYear ? (
            <SvgText x={width - PAD.right} y={HEIGHT - 6} fontSize={10} fill={colors.textSecondary} textAnchor="end">
              {String(lastYear)}
            </SvgText>
          ) : null}
          <Polyline
            points={points.map((p) => `${x(p.t)},${y(p.value)}`).join(' ')}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <Circle
              key={i}
              cx={x(p.t)}
              cy={y(p.value)}
              r={4}
              fill={colors.primary}
              stroke={colors.inputFilledBackground}
              strokeWidth={2}
            />
          ))}
        </Svg>
      ) : (
        <View style={{ height: HEIGHT }} />
      )}
    </View>
  );
}
