/**
 * A single transaction row card.
 *
 * - Leading 32×32 circle (revenue ↑ / expense ↓ icon, tinted)
 * - Colored left edge (3px, revenue teal / expense copper) — redundant with
 *   the icon color so colorblind users still distinguish revenue from expense.
 * - Right side: signed amount + date.
 */
import React from 'react';
import {
  I18nManager,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Checkbox, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { darkColors, ICON_XS, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';
import { formatMoney } from '@/src/shared/utils/money';
import type { Transaction } from '@/src/shared/types';

interface TransactionRowProps {
  transaction: Transaction;
  isSelectMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function TransactionRow({
  transaction,
  isSelectMode,
  isSelected,
  onPress,
  onLongPress,
}: TransactionRowProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const isRtl = I18nManager.isRTL;

  const isRevenue = transaction.type === 'revenue';
  const fg = isRevenue ? colors.revFg : colors.expFg;
  const bg = isRevenue ? colors.revBg : colors.expBg;
  const sign = isRevenue ? '+' : '−'; // U+2212

  const subtitle = [
    transaction.category_name
      ? t(`expenseCategories.${transaction.category_name.toLowerCase()}`, {
          defaultValue: transaction.category_name,
        })
      : null,
    transaction.renter_name,
    transaction.supplier_name,
  ]
    .filter(Boolean)
    .join(' · ');

  const dateStr = transaction.date_of_payment;
  const formattedDate = (() => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(i18n.language, {
      day: '2-digit',
      month: 'short',
    });
  })();

  // Leading-edge color bar: in RTL, the leading edge is on the right.
  const edgeStyle = isRtl
    ? { borderRightWidth: 3, borderRightColor: fg }
    : { borderLeftWidth: 3, borderLeftColor: fg };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.card,
          edgeStyle,
          {
            backgroundColor: colors.surface,
            borderColor: colors.outline,
            shadowColor: '#000',
          },
        ]}
      >
        {isSelectMode ? (
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={onPress}
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
            numberOfLines={1}
          >
            {transaction.property_name}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.trailing}>
          <Text style={[styles.amount, { color: fg }]}>
            {`${sign}${formatMoney(transaction.amount)}`}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formattedDate}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  date: {
    fontSize: 11,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
});
