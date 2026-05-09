import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';

interface TransactionSectionHeaderProps {
  title: string;
  profit: number;
}

export function TransactionSectionHeader({ title, profit }: TransactionSectionHeaderProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const isLoss = profit < 0;
  const sign = isLoss ? '−' : '+';
  const color = isLoss ? colors.expFg : colors.revFg;

  return (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
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
