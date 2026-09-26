/**
 * A single transaction row card.
 *
 * - Leading 36×36 tile (revenue ↑ / expense ↓ icon, tinted)
 * - Right side: signed amount + date.
 *
 * Borderless, on the same surface as the Properties and Renters rows. There used to be a
 * coloured leading edge as well, but it only ever repeated the icon's colour - it could not
 * help anyone who cannot tell teal from copper. The arrow's direction and the +/− sign carry
 * revenue vs expense without relying on colour.
 */
import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Checkbox, Text, useTheme } from 'react-native-paper';

import {
  cardShadow,
  darkColors,
  ICON_XS,
  lightColors,
  radii,
  spacing,
  useIsLargeText,
} from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';
import { formatMoney } from '@/src/shared/utils/money';
import type { Transaction } from '@/src/shared/types';
import { fmtTxDate } from '@/src/features/transactions/utils/aggregate';
import type { TFunction } from 'i18next';

interface TransactionRowProps {
  transaction: Transaction;
  locale: string;
  t: TFunction;
  isSelectMode: boolean;
  isSelected: boolean;
  onPress: (id: number) => void;
  onLongPress: (id: number) => void;
}

export const TransactionRow = React.memo(function TransactionRow({
  transaction,
  locale,
  t,
  isSelectMode,
  isSelected,
  onPress,
  onLongPress,
}: TransactionRowProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const isLargeText = useIsLargeText();

  const subtitle = React.useMemo(() => (
    [
      transaction.category_name
        ? t(`expenseCategories.${transaction.category_name.toLowerCase()}`, { defaultValue: transaction.category_name })
        : null,
      transaction.renter_name,
      transaction.supplier_name,
    ].filter(Boolean).join(' · ')
  ), [transaction.category_name, transaction.renter_name, transaction.supplier_name, t]);

  const formattedDate = React.useMemo(
    () => fmtTxDate(transaction, locale),
    [transaction, locale],
  );

  const isRevenue = transaction.type === 'revenue';
  const fg = isRevenue ? colors.revFg : colors.expFg;
  const bg = isRevenue ? colors.revBg : colors.expBg;
  const sign = isRevenue ? '+' : '−'; // U+2212

  return (
    <TouchableOpacity
      onPress={() => onPress(transaction.id)}
      onLongPress={() => onLongPress(transaction.id)}
      activeOpacity={0.7}
    >
      <View
        style={[styles.card, { backgroundColor: colors.surface }]}
      >
        {isSelectMode ? (
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={() => onPress(transaction.id)}
          />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: bg }]}>
            <Icon
              name={isRevenue ? 'arrow-up-right' : 'arrow-down-right'}
              size={ICON_XS}
              color={fg}
            />
          </View>
        )}

        <View style={styles.center}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={isLargeText ? 2 : 1}
          >
            {transaction.property_name}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={isLargeText ? 2 : 1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.trailing}>
          <Text style={[styles.amount, { color: fg }]}>
            {`‪${sign}${formatMoney(transaction.amount)}‬`}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 14,
    borderRadius: radii.lg,
    marginBottom: 10,
    ...cardShadow,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  trailing: {
    alignItems: 'flex-end',
    // In any row one side yields and one is protected, and it must never be the number.
    // Without this the amount column shrank in step with the address and clipped: `+2,200`
    // rendered as `+2.20`, which is not a layout bug, it is a wrong figure. The address has
    // `flex: 1, minWidth: 0` and truncates instead.
    flexShrink: 0,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    writingDirection: 'ltr',
    textAlign: 'right',
  },
  date: {
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
