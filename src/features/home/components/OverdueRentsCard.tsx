import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { CompactRenterRow } from './CompactRenterRow';
import { usePropertyContext } from '@/src/context';
import { useTransactionSummaryContext } from '@/src/context';
import { usePaginatedTransactionContext } from '@/src/features/transactions/context/PaginatedTransactionContext';
import { createRevenueTransaction } from '@/src/features/transactions/api/transactions';
import { type PaymentMethod } from '@/src/shared/types';
import { useAlert } from '@/src/core/context';
import { formatMoney } from '@/src/shared/utils/money';
import { Icon } from '@/src/shared/components/ui/Icon';
import { FilterBottomSheet, type FilterOption } from '@/src/shared/components/ui/FilterBottomSheet';
import { getOverdueRenters, type OverdueRenter } from '@/src/features/home/api/homeApi';

type ButtonState = 'idle' | 'loading';

function mapPaymentType(pt?: string | null): PaymentMethod {
  if (pt === 'wire_transfer') return 'bank_transfer';
  if (pt === 'bit') return 'bit';
  if (pt === 'check') return 'check';
  return 'cash';
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthFor(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export function OverdueRentsCard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { appAlert } = useAlert();
  const { properties } = usePropertyContext();
  const { refresh: refreshSummary } = useTransactionSummaryContext();
  const { refresh: refreshTransactions } = usePaginatedTransactionContext();

  const [renters, setRenters] = useState<OverdueRenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [buttonStates, setButtonStates] = useState<Map<number, ButtonState>>(new Map());
  const [paidIds, setPaidIds] = useState<Set<number>>(new Set());
  const [filterOwner, setFilterOwner] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const fetchOverdue = useCallback(async (owner?: string | null) => {
    setLoading(true);
    try {
      const data = await getOverdueRenters(owner ? { property_owner: owner } : undefined);
      setRenters(data);
      setPaidIds(new Set());
    } catch {
      // silently fail — card just shows empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverdue(filterOwner);
  }, [filterOwner, fetchOverdue]);

  const visibleRenters = renters.filter((r) => !paidIds.has(r.renter_id));

  const ownerOptions: FilterOption[] = Array.from(
    new Set(
      properties
        .map((p) => p.property_owner?.trim())
        .filter((o): o is string => !!o),
    ),
  ).map((o) => ({ id: o, label: o }));

  const setButtonState = (renterId: number, state: ButtonState) => {
    setButtonStates((prev) => new Map(prev).set(renterId, state));
  };

  const handleMarkPaid = useCallback(async (renter: OverdueRenter) => {
    if (!renter.property_id) return;
    setButtonState(renter.renter_id, 'loading');
    try {
      await createRevenueTransaction({
        property_id: renter.property_id,
        renter_id: renter.renter_id,
        amount: renter.monthly_amount,
        date_of_payment: todayIso(),
        month_for: currentMonthFor(),
        payment_method: mapPaymentType(null),
      });
      setPaidIds((prev) => new Set(prev).add(renter.renter_id));
      await Promise.all([refreshSummary(), refreshTransactions()]);
    } catch {
      setButtonState(renter.renter_id, 'idle');
      appAlert(t('error.title'), t('error.saveTransactionFailed'));
    }
  }, [refreshSummary, refreshTransactions, appAlert, t]);

  const badgeColor = colors.expFg;
  const badgeBg = colors.expBg;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('home.overdueRents')}</Text>
        <View style={styles.headerRight}>
          <View style={[styles.countBadge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.countText, { color: badgeColor }]}>{visibleRenters.length}</Text>
          </View>
          {ownerOptions.length > 0 && (
            <TouchableOpacity onPress={() => setSheetVisible(true)} hitSlop={8}>
              <Icon
                name="filter"
                size={14}
                color={filterOwner ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      ) : (
        <ScrollView style={styles.list} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {visibleRenters.map((renter, idx) => {
            const isSubmitting = (buttonStates.get(renter.renter_id) ?? 'idle') === 'loading';
            const btnBg = colors.revBg;
            const btnIconColor = colors.revFg;
            const badge = `${renter.days_overdue}d`;

            return (
              <View key={renter.renter_id}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.outline }]} />}
                <View style={styles.row}>
                  <View style={styles.rowContent}>
                    <CompactRenterRow
                      name={`${renter.first_name} ${renter.last_name}`}
                      badge={badge}
                      badgeColor={badgeColor}
                      badgeBg={badgeBg}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.checkBtn, { backgroundColor: btnBg }]}
                    onPress={() => handleMarkPaid(renter)}
                    disabled={isSubmitting}
                    activeOpacity={0.75}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.revFg} />
                    ) : (
                      <Icon name="check" size={ICON_SM} color={btnIconColor} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      <FilterBottomSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
        title={t('home.filterByOwner', { defaultValue: 'Filter by owner' })}
        options={ownerOptions}
        selectedId={filterOwner}
        onSelect={(id) => setFilterOwner(id as string | null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    height: 190,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  countBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  checkBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -spacing.md,
  },
});
