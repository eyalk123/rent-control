import { StyleSheet, View } from 'react-native';
import { useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';

interface TransactionSectionHeaderProps {
  title: string;
  profit: number;
  /**
   * Whether every row of this month has been loaded. A month total summed from a
   * half-loaded month is simply wrong, and worse, it changes under the reader as the
   * next page lands - so an incomplete month shows a placeholder instead of a number.
   */
  complete: boolean;
  /** Set on the first section only, so the tour can point at the month grouping.
   *  Undefined on the rest: the ref still runs, it just registers nothing. */
  anchorId?: string;
}

export function TransactionSectionHeader({ title, profit, complete, anchorId }: TransactionSectionHeaderProps) {
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
      {complete ? (
        <Text style={[styles.sectionProfit, { color }]}>
          {`‪${sign}${formatMoney(Math.abs(profit))}‬`}
        </Text>
      ) : (
        <Text style={[styles.sectionProfit, styles.sectionPending, { color: colors.textSecondary }]}>
          {'···'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Nothing above the text but this padding. The separation from the previous month is
    // the section footer's job (`renderSectionFooter` in TransactionsListScreen) because this
    // row *sticks* to the top of the list: anything added here is dead space between the
    // status bar and the pinned month, and a margin is worse still - it sits outside the
    // painted background, so list rows slid through the strip it left.
    paddingVertical: spacing.sm,
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
  sectionPending: {
    letterSpacing: 2,
  },
});
