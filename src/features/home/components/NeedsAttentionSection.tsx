import React, { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { darkColors, ICON_MD, ICON_SM, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui/Icon';
import { SkeletonBlock } from '@/src/shared/components/ui/SkeletonBlock';
import { useShimmer } from '@/src/shared/hooks/useShimmer';
import { formatMoney } from '@/src/shared/utils/money';
import { formatDateShort } from '@/src/shared/utils/dates';
import { getNotifications, dismissNotification } from '@/src/features/notifications/api/feed';
import type { NotificationItem } from '@/src/features/notifications/types';
import { createRevenueTransaction } from '@/src/features/transactions/api/transactions';
import { useTransactionSummaryContext } from '@/src/context';
import { usePaginatedTransactionContext } from '@/src/features/transactions/context/PaginatedTransactionContext';
import { useAlert } from '@/src/core/context';
import type { PaymentMethod } from '@/src/shared/types';

const PREVIEW_LIMIT = 2;
const SCREEN_HEIGHT = Dimensions.get('window').height;

function mapPaymentType(pt?: string | null): PaymentMethod {
  if (pt === 'wire_transfer') return 'bank_transfer';
  if (pt === 'bit') return 'bit';
  if (pt === 'check') return 'check';
  return 'cash';
}

function todayIso() { return new Date().toISOString().slice(0, 10); }
function currentMonthFor() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function isoFromDaysOut(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A feed item flattened into the shape the rows render. `notifId` keys the
 * server dismiss; the server already collapses duplicate offsets. */
type AttentionItem = {
  notifId: number;
  renter_id: number;
  first_name: string;
  last_name: string;
  property_id: number | null;
  property_address: string | null;
  payment_type: string | null;
} & (
  | { _type: 'expiring'; days_until_expiry: number; lease_end_date: string }
  | { _type: 'overdue'; days_overdue: number; monthly_amount: number }
);

function toAttentionItem(n: NotificationItem): AttentionItem {
  const base = {
    notifId: n.id,
    renter_id: n.renter_id,
    first_name: n.first_name ?? '',
    last_name: n.last_name ?? '',
    property_id: n.property_id,
    property_address: n.property_address,
    payment_type: n.payment_type,
  };
  if (n.type === 'lease_expiring') {
    const days = n.data.days_until_expiry ?? 0;
    return { ...base, _type: 'expiring', days_until_expiry: days, lease_end_date: isoFromDaysOut(days) };
  }
  return { ...base, _type: 'overdue', days_overdue: n.data.days_overdue ?? 0, monthly_amount: n.data.amount ?? 0 };
}

function formatLeaseDate(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return formatDateShort(new Date(year, month - 1, day), locale);
}

interface ActionPillProps {
  label: string;
  bg: string;
  textColor: string;
  onPress: () => void;
}

function ActionPill({ label, bg, textColor, onPress }: ActionPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.pillText, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

interface AttentionItemRowProps {
  item: AttentionItem;
  isLast: boolean;
  colors: typeof lightColors | typeof darkColors;
  amberBg: string;
  primaryBg: string;
  neutralBg: string;
  onDismiss: (notifId: number) => void;
  onNavigate: (path: string) => void;
  onMarkPaid: (item: AttentionItem) => void;
  markPaidLoadingIds: Set<number>;
}

function AttentionItemRow({
  item, isLast, colors, amberBg, primaryBg, neutralBg, onDismiss, onNavigate, onMarkPaid, markPaidLoadingIds,
}: AttentionItemRowProps) {
  const { t, i18n } = useTranslation();
  const name = `${item.first_name} ${item.last_name}`;
  const address = item.property_address ?? '';

  if (item._type === 'expiring') {
    return (
      <View>
        <View style={styles.itemRow}>
          <View style={[styles.iconBadge, { backgroundColor: amberBg }]}>
            <Icon name="calendar" size={ICON_MD} color={colors.warning} />
          </View>
          <View style={styles.centerContent}>
            <View style={styles.topLine}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                {name}
              </Text>
              <View style={[styles.infoBadge, { backgroundColor: amberBg }]}>
                <Text style={[styles.infoBadgeText, { color: colors.warning }]}>
                  {t(item.days_until_expiry === 1 ? 'home.expiresIn' : 'home.expiresInPlural', { count: item.days_until_expiry })}
                </Text>
              </View>
            </View>
            <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
              {address}
            </Text>
            <Text style={[styles.subInfo, { color: colors.textSecondary }]}>
              {t('home.expiresLabel', { date: formatLeaseDate(item.lease_end_date, i18n.language) })}
            </Text>
            <View style={styles.actionsRow}>
              <ActionPill
                label={t('home.actionIgnore')}
                bg={neutralBg}
                textColor={colors.textSecondary}
                onPress={() => onDismiss(item.notifId)}
              />
              <ActionPill
                label={t('home.actionUpdateLease')}
                bg={primaryBg}
                textColor={colors.primary}
                onPress={() => onNavigate('/renters')}
              />
            </View>
          </View>
        </View>
        {!isLast && <View style={[styles.divider, { backgroundColor: colors.outline }]} />}
      </View>
    );
  }

  return (
    <View>
      <View style={styles.itemRow}>
        <View style={[styles.iconBadge, { backgroundColor: colors.expBg }]}>
          <Icon name="alert-circle" size={ICON_MD} color={colors.expFg} />
        </View>
        <View style={styles.centerContent}>
          <View style={styles.topLine}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
            <View style={[styles.infoBadge, { backgroundColor: colors.expBg }]}>
              <Text style={[styles.infoBadgeText, { color: colors.expFg }]}>
                {t(item.days_overdue === 1 ? 'home.daysOverdue' : 'home.daysOverduePlural', { count: item.days_overdue })}
              </Text>
            </View>
          </View>
          <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
            {address}
          </Text>
          <Text style={[styles.subInfo, { color: colors.textPrimary }]}>
            {formatMoney(item.monthly_amount)}
          </Text>
          <View style={styles.actionsRow}>
            <ActionPill
              label={t('home.actionIgnore')}
              bg={neutralBg}
              textColor={colors.textSecondary}
              onPress={() => onDismiss(item.notifId)}
            />
            <ActionPill
              label={markPaidLoadingIds.has(item.renter_id) ? t('home.actionSaving') : t('home.actionMarkPaid')}
              bg={colors.revBg}
              textColor={colors.revFg}
              onPress={() => !markPaidLoadingIds.has(item.renter_id) && onMarkPaid(item)}
            />
          </View>
        </View>
      </View>
      {!isLast && <View style={[styles.divider, { backgroundColor: colors.outline }]} />}
    </View>
  );
}

export function NeedsAttentionSection() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appAlert } = useAlert();
  const { refresh: refreshSummary } = useTransactionSummaryContext();
  const { refresh: refreshTransactions } = usePaginatedTransactionContext();

  const [items, setItems] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markPaidLoadingIds, setMarkPaidLoadingIds] = useState<Set<number>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const isFirstLoad = useRef(true);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const feed = await getNotifications('all');
      setItems(feed.map(toAttentionItem));
    } catch {
      // section stays as-is on error
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const silent = !isFirstLoad.current;
      isFirstLoad.current = false;
      fetchData(silent);
    }, [fetchData]),
  );

  const navigate = (path: string) => {
    setModalVisible(false);
    router.push(path as never);
  };

  // Ignore -> dismiss on the server (clears the whole offset group), then refetch.
  const dismiss = useCallback(async (notifId: number) => {
    setItems((prev) => prev.filter((i) => i.notifId !== notifId)); // optimistic
    try {
      await dismissNotification(notifId);
    } catch {
      fetchData(true);
    }
  }, [fetchData]);

  const handleMarkPaid = useCallback(async (item: AttentionItem) => {
    if (item._type !== 'overdue' || !item.property_id) return;
    setMarkPaidLoadingIds((prev) => new Set(prev).add(item.renter_id));
    try {
      await createRevenueTransaction({
        property_id: item.property_id,
        renter_id: item.renter_id,
        amount: item.monthly_amount,
        date_of_payment: todayIso(),
        month_for: currentMonthFor(),
        payment_method: mapPaymentType(item.payment_type),
      });
      await dismissNotification(item.notifId);
      setItems((prev) => prev.filter((i) => i.notifId !== item.notifId));
      await Promise.allSettled([refreshSummary(), refreshTransactions()]);
    } catch {
      appAlert('Error', 'Failed to record payment. Please try again.');
    } finally {
      setMarkPaidLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.renter_id);
        return next;
      });
    }
  }, [refreshSummary, refreshTransactions, appAlert]);

  const expiring = items.filter((i): i is Extract<AttentionItem, { _type: 'expiring' }> => i._type === 'expiring');
  // Lease-expiring first, then overdue (preserves the prior ordering).
  const allItems: AttentionItem[] = [...expiring, ...items.filter((i) => i._type === 'overdue')];

  const previewItems = allItems.slice(0, PREVIEW_LIMIT);
  const hasMore = allItems.length > PREVIEW_LIMIT;

  const amberBg = theme.dark ? 'rgba(194,149,67,0.18)' : 'rgba(212,162,76,0.15)';
  const primaryBg = theme.dark ? 'rgba(62,111,168,0.18)' : 'rgba(30,58,95,0.10)';
  const neutralBg = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const shimmer = useShimmer(loading);
  const rowProps = { colors, amberBg, primaryBg, neutralBg, onDismiss: dismiss, onNavigate: navigate, onMarkPaid: handleMarkPaid, markPaidLoadingIds };

  // Label + a manage button that opens the notification rules page, shown in
  // every state so the rules are always reachable from Home.
  const header = (
    <View style={styles.headerRow}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        {t('home.needsAttention').toUpperCase()}
      </Text>
      <TouchableOpacity
        onPress={() => navigate('/notifications')}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={t('notifications.manageTitle')}
      >
        <Icon name="settings" size={ICON_SM} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <>
        {header}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: colors.outline }]}>
        {[0, 1].map((i) => (
          <View key={i}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.outline }]} />}
            <View style={styles.itemRow}>
              <SkeletonBlock opacity={shimmer} width={40} height={40} borderRadius={11} />
              <View style={[styles.centerContent, { gap: 6 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <SkeletonBlock opacity={shimmer} width="45%" height={13} borderRadius={4} />
                  <SkeletonBlock opacity={shimmer} width="20%" height={18} borderRadius={6} />
                </View>
                <SkeletonBlock opacity={shimmer} width="35%" height={11} borderRadius={4} />
                <SkeletonBlock opacity={shimmer} width="25%" height={11} borderRadius={4} />
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.xs, marginTop: 3 }}>
                  <SkeletonBlock opacity={shimmer} width={52} height={26} borderRadius={20} />
                  <SkeletonBlock opacity={shimmer} width={80} height={26} borderRadius={20} />
                </View>
              </View>
            </View>
          </View>
        ))}
        </View>
      </>
    );
  }

  if (allItems.length === 0) {
    const nearest = expiring.length > 0
      ? expiring.reduce((a, b) => a.days_until_expiry < b.days_until_expiry ? a : b)
      : null;
    const showMeta = nearest !== null && nearest.days_until_expiry <= 60;
    const pillBg = theme.dark ? 'rgba(31,122,96,0.18)' : '#E6F0EA';

    return (
      <>
        {header}
        <View style={[styles.catchUpPill, { backgroundColor: pillBg }]}>
          <View style={styles.catchUpDot} />
          <Text style={styles.catchUpTitle}>{t('home.allCaughtUp')}</Text>
          {showMeta && (
            <Text style={styles.catchUpMeta}>
              {t('home.nextDueMeta', {
                date: formatLeaseDate(nearest!.lease_end_date, i18n.language),
                days: nearest!.days_until_expiry,
              })}
            </Text>
          )}
        </View>
      </>
    );
  }

  return (
    <>
      {header}
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: colors.outline }]}>
        {previewItems.map((item, idx) => (
          <AttentionItemRow
            key={item.notifId}
            item={item}
            isLast={idx === previewItems.length - 1 && !hasMore}
            {...rowProps}
          />
        ))}

        {hasMore && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.outline }]} />
            <View style={styles.seeAllRow}>
              <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>
                  {t('home.seeAllCount', { count: allItems.length })}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{t('home.needsAttention')}</Text>
            <View style={[styles.sheetCountBadge, { backgroundColor: neutralBg }]}>
              <Text style={[styles.sheetCountText, { color: colors.textSecondary }]}>{allItems.length}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)} hitSlop={12}>
              <Icon name="x" size={ICON_SM} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
            {allItems.map((item, idx) => (
              <AttentionItemRow
                key={item.notifId}
                item={item}
                isLast={idx === allItems.length - 1}
                {...rowProps}
              />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 6,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  centerContent: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  address: {
    fontSize: 12,
  },
  subInfo: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: 3,
  },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: -spacing.md,
  },
  seeAllRow: {
    paddingVertical: 6,
    alignItems: 'flex-end',
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  catchUpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  catchUpDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#1F7A60',
    flexShrink: 0,
  },
  catchUpTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#155845',
  },
  catchUpMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(31,122,96,0.80)',
    marginStart: 'auto' as any,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.35)',
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  sheetCountBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sheetCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  sheetScroll: {
    paddingBottom: spacing.md,
  },
});
