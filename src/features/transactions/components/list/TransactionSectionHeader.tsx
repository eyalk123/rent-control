import { StyleSheet, View } from 'react-native';
import { useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';

interface TransactionSectionHeaderProps {
  title: string;
  profit: number;
  /** Set on the first section only, so the tour can point at the month grouping.
   *  Undefined on the rest: the ref still runs, it just registers nothing. */
  anchorId?: string;
}

export function TransactionSectionHeader({ title, profit, anchorId }: TransactionSectionHeaderProps) {
  const anchorRef = useTourAnchor(anchorId);
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const isLoss = profit < 0;
  const sign = isLoss ? '−' : '+';
  const color = isLoss ? colors.expFg : colors.revFg;

  return (
    <View ref={anchorRef} collapsable={false} style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <Text style={[styles.sectionProfit, { color }]}>
        {`${sign}${formatMoney(Math.abs(profit))}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sectionProfit: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
