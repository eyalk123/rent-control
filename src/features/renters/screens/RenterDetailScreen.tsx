import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Button, IconButton, Menu, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getRenterById,
  terminateLease,
  undoTermination,
  updateRenter,
} from '@/src/features/renters/api/renters';
import { getApiErrorMessage } from '@/src/core/api/client';
import type { Renter } from '@/src/shared/types';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import {
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
} from '@/src/shared/components/ui';
import { lightColors, darkColors, spacing } from '@/src/core/theme';
import { RenterAvatar } from '@/src/features/renters/components/RenterAvatar';
import { EndLeaseDialog } from '@/src/features/renters/components/EndLeaseDialog';
import { getRenterLifecycle, isTerminated } from '@/src/shared/utils/renterStatus';
import { formatDateFull } from '@/src/shared/utils/dates';
import { RenterInfoTab } from '@/src/features/renters/components/RenterInfoTab';
import { RenterPropertyTab } from '@/src/features/renters/components/RenterPropertyTab';
import { RenterTransactionsTab } from '@/src/features/renters/components/RenterTransactionsTab';
import {
  initialTransactionsTabState,
  type TransactionsTabState,
} from '@/src/features/transactions/components/detail/tabState';
import { ANCHORS } from '@/src/features/onboarding/anchors';
import { TourAnchor, useTourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour, useTourStep } from '@/src/features/onboarding/TourController';

type TabKey = 'info' | 'property' | 'transactions';

/** The `renter-detail` steps that are about the Transactions tab rather than the lease. */
const TOUR_TX_STEPS = ['payments', 'expenses'];

export function RenterDetailScreen() {
  // The Extend and End buttons exist only on a live lease, so their steps are `optional`
  // in the registry and drop themselves on an ended or terminated one. They used to be
  // required, which meant the anchor wait never resolved there — it has no timeout, only
  // the `skipWhen` deadline does — and the tour simply never opened on those renters.
  useTour('renter-detail');
  const { t, i18n: { language } } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const colors = theme.dark ? darkColors : lightColors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [renter, setRenter] = useState<Renter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('info');
  // Owned here, not in the tab: the tabs render conditionally, so leaving Transactions
  // unmounts the panel and would otherwise discard the section and its filters.
  const [txTabState, setTxTabState] = useState<TransactionsTabState>(initialTransactionsTabState);
  const panelAnchorRef = useTourAnchor(ANCHORS.renterDetailPanel);
  /**
   * The tab the tour is talking about, or the user's own when no tour is running.
   *
   * Derived, never written: `useTourStep` goes null the moment the tour ends and the screen
   * is back on whichever tab the user had chosen, with nothing to restore. The `payments`
   * and `expenses` steps show the Transactions tab so the month grid is something the user
   * watches appear, and every other step shows Info, which is where the timeline it points
   * at lives.
   */
  const tourStep = useTourStep('renter-detail');
  const shownTab: TabKey =
    tourStep === null ? activeTab : TOUR_TX_STEPS.includes(tourStep) ? 'transactions' : 'info';
  /**
   * Revenue and expenses are a segmented control on this screen, not two panels side by
   * side, so a tour that only lands on the tab shows revenue and never mentions that the
   * other half exists. Driven the same way as the tab above it, and derived the same way:
   * the moment the tour ends this is null again and the user's own choice is back.
   */
  const shownTxState: TransactionsTabState =
    tourStep === 'expenses'
      ? { ...txTabState, section: 'expenses' }
      : tourStep === 'payments'
        ? { ...txTabState, section: 'revenue' }
        : txTabState;
  const [endLeaseOpen, setEndLeaseOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [lifecyclePending, setLifecyclePending] = useState(false);
  const [linkPending, setLinkPending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function fetchRenter() {
        const numericId = Number(id);
        if (isNaN(numericId)) {
          setError(t('error.invalidRenterId'));
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const data = await getRenterById(numericId);
          setRenter(data);
        } catch (err) {
          setError(getApiErrorMessage(err, t('error.loadFailed')));
        } finally {
          setLoading(false);
        }
      }
      fetchRenter();
    }, [id, t])
  );

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (renter) {
      router.push(`/renters/edit/${renter.id}` as any);
    }
  };

  const handleExtend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (renter) {
      router.push(`/renters/extend/${renter.id}` as any);
    }
  };

  const handleLinkProperty = async (propertyId: number) => {
    if (!renter) return;
    setLinkPending(true);
    try {
      // The PATCH echoes the updated renter, so the screen refreshes from it rather than
      // re-fetching — same arrangement as the lease handlers below.
      setRenter(await updateRenter(renter.id, { property_id: propertyId }));
    } catch (err) {
      setError(getApiErrorMessage(err, t('error.saveFailed')));
    } finally {
      setLinkPending(false);
    }
  };

  const handleEndLease = async (terminatedOn: string, reason: string | null) => {
    if (!renter) return;
    setLifecyclePending(true);
    try {
      // The response carries the updated renter, so the screen refreshes from it rather
      // than re-fetching.
      setRenter(await terminateLease(renter.id, { terminated_on: terminatedOn, reason }));
      setEndLeaseOpen(false);
    } catch (err) {
      setError(getApiErrorMessage(err, t('error.saveFailed')));
    } finally {
      setLifecyclePending(false);
    }
  };

  const handleReopenLease = async () => {
    if (!renter) return;
    setLifecyclePending(true);
    try {
      setRenter(await undoTermination(renter.id));
    } catch (err) {
      setError(getApiErrorMessage(err, t('error.saveFailed')));
    } finally {
      setLifecyclePending(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error || !renter) {
    return (
      <ScreenContainer>
        <EmptyState
          message={error ?? t('error.renterNotFound')}
          icon="alert-circle"
        />
      </ScreenContainer>
    );
  }

  const ended = getRenterLifecycle(renter) === 'ended';
  const terminated = isTerminated(renter);
  // A lease that simply ran its term is the canonical thing you renew, and the tenant
  // routinely stays on while the paperwork catches up — so Extend survives expiry. A
  // *terminated* lease is different: the owner has declared the tenancy over, so the
  // honest move is Reopen first. Extending it would silently un-end it.
  const canExtend = !terminated;

  return (
    <ScreenContainer edges={['left', 'right']}>
      <View style={styles.container}>
        {/* Header: avatar + name + edit */}
        <View>
          <View
            style={[
              styles.avatarSection,
              { paddingTop: insets.top + spacing.sm, backgroundColor: colors.inputBackground },
            ]}
          >
            <RenterAvatar
              renter={renter}
              size={80}
              backgroundColor={colors.primary}
              textColor="#FFF"
            />
            {/* Absolutely positioned, so the positioning moves to the anchor wrapper for
                the same reason Extend and End below do — see the note there. */}
            <TourAnchor id={ANCHORS.renterDetailEdit} style={styles.editIcon}>
              <IconButton
                icon="pencil"
                iconColor="#FFF"
                size={20}
                style={[styles.iconButtonReset, { backgroundColor: colors.primary }]}
                onPress={handleEdit}
                accessibilityLabel={t('renter.editRenter')}
              />
            </TourAnchor>
            {/* Edit stays on an ended lease, since a past tenancy's record can still need
                correcting - and so does Extend, unless the lease was terminated. */}
            {/* The absolute positioning moves to the anchor wrapper: a wrapper View around
                an absolutely-positioned child would become its containing block and drag
                the button back into the flow. */}
            {/* Extend normally sits inboard of the overflow, but the overflow is only
                rendered while the lease is live. On an ended lease it kept the 44px offset
                and left exactly one button of empty space at the edge, so it takes the
                edge position itself when there is no overflow beside it. */}
            {canExtend && (
              <TourAnchor
                id={ANCHORS.renterDetailExtend}
                style={ended ? styles.extendIconAlone : styles.extendIcon}
              >
                <IconButton
                  icon="calendar-plus"
                  iconColor="#FFF"
                  size={20}
                  style={[styles.iconButtonReset, { backgroundColor: colors.primary }]}
                  onPress={handleExtend}
                  accessibilityLabel={t('renter.extendLease')}
                />
              </TourAnchor>
            )}
            {/* End lease lives behind the overflow rather than beside Extend. As two filled
                circles they were `calendar-plus` next to `calendar-remove` at 20px - the same
                colour, size and icon family, differing by a few pixels - so a routine action
                and a lifecycle one read as a pair. The menu gives End lease the text label an
                icon-only button cannot have, and leaves Extend the only lease button up here.
                Not styled destructive, for the reason the web hero notes: dressing it like
                Delete pushes people into rewriting the lease term by hand instead. */}
            {!ended && (
              <View style={styles.moreIcon}>
                <Menu
                  visible={moreOpen}
                  onDismiss={() => setMoreOpen(false)}
                  // Drops from under the button rather than over it: the default `top`
                  // covers the header controls it was opened from.
                  anchorPosition="bottom"
                  anchor={
                    /* The absolute positioning sits on the View *outside* Menu: Menu wraps its
                       anchor in a plain View and measures that to place the surface, so an
                       absolutely-positioned child would collapse it and misplace the menu. */
                    <TourAnchor id={ANCHORS.renterDetailMore}>
                      <IconButton
                        icon="dots-vertical"
                        iconColor="#FFF"
                        size={20}
                        style={[styles.iconButtonReset, { backgroundColor: colors.primary }]}
                        onPress={() => setMoreOpen(true)}
                        accessibilityLabel={t('common.moreActions')}
                      />
                    </TourAnchor>
                  }
                >
                  <Menu.Item
                    leadingIcon="calendar-remove"
                    onPress={() => {
                      setMoreOpen(false);
                      setEndLeaseOpen(true);
                    }}
                    title={t('renter.endLease')}
                  />
                </Menu>
              </View>
            )}
          </View>

          <View style={styles.nameRow}>
            <Text
              variant="titleLarge"
              style={[styles.nameText, { color: colors.textPrimary }]}
            >
              {renter.first_name} {renter.last_name}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: colors.textSecondary, textAlign: 'center' }}
            >
              {renter.property ? `${renter.property.address}${formatFloorApartment(renter.property, t)}` : t('renter.unassigned')}
            </Text>
          </View>

          {/* Two treatments, split by whether there is anything to act on.
              A plainly expired lease is metadata, so it reads as a chip that continues the
              centred name block above it. A *terminated* one carries a date, often a reason
              and always a Reopen action, which earns the full banner. Using the banner for
              both left the expired case as a full-width bordered box with one short
              left-aligned line and a large empty right half. */}
          {ended && !terminated && (
            <View style={styles.statusChipRow}>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: colors.inputFilledBackground, borderColor: colors.outline },
                ]}
              >
                <Text variant="labelMedium" style={{ color: colors.textSecondary }}>
                  {t('renter.endedLeaseShort')}
                </Text>
              </View>
            </View>
          )}

          {ended && terminated && (
            <View
              style={[
                styles.endedBanner,
                { backgroundColor: colors.inputFilledBackground, borderColor: colors.outline },
              ]}
            >
              <View style={styles.endedBannerText}>
                <Text variant="labelLarge" style={{ color: colors.textPrimary }}>
                  {renter.terminated_on
                    ? t('renter.terminatedLease', {
                        date: formatDateFull(new Date(renter.terminated_on), language),
                      })
                    : t('renter.endedLeaseShort')}
                </Text>
                {!!renter.termination_reason && (
                  <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                    {t('renter.terminatedReason', { reason: renter.termination_reason })}
                  </Text>
                )}
              </View>
              <Button
                mode="outlined"
                compact
                disabled={lifecyclePending}
                onPress={handleReopenLease}
              >
                {t('renter.reopenLease')}
              </Button>
            </View>
          )}

          {/* Tab bar */}
          <TourAnchor
            id={ANCHORS.renterDetailTabs}
            style={[styles.tabBar, { backgroundColor: colors.inputBackground }]}
          >
            {([
              { value: 'info', label: t('renter.tabs.info') },
              { value: 'property', label: t('renter.tabs.property') },
              { value: 'transactions', label: t('renter.tabs.transactions') },
            ] as const).map((tab) => {
              const isActive = shownTab === tab.value;
              return (
                <Pressable
                  key={tab.value}
                  style={[
                    styles.tab,
                    isActive && { borderBottomColor: colors.primary },
                  ]}
                  onPress={() => setActiveTab(tab.value as TabKey)}
                >
                  <Text
                    variant="labelLarge"
                    style={[
                      styles.tabLabel,
                      { color: isActive ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </TourAnchor>
        </View>

        {/* Tab content */}
        <View ref={panelAnchorRef} collapsable={false} style={styles.tabContent}>
          {shownTab === 'info' && <RenterInfoTab renter={renter} />}
          {shownTab === 'property' && (
            <RenterPropertyTab
              renter={renter}
              onLinkProperty={handleLinkProperty}
              linkPending={linkPending}
            />
          )}
          {shownTab === 'transactions' && (
            <RenterTransactionsTab
              renter={renter}
              state={shownTxState}
              onStateChange={setTxTabState}
            />
          )}
        </View>
      </View>
      <EndLeaseDialog
        visible={endLeaseOpen}
        renter={renter}
        loading={lifecyclePending}
        onConfirm={handleEndLease}
        onDismiss={() => setEndLeaseOpen(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  endedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
  },
  endedBannerText: {
    flex: 1,
    gap: 2,
  },
  statusChipRow: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  // Shrinks to its text rather than stretching, so there is no empty half to explain.
  statusChip: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
  },
  // The overflow terminates the row at the physical edge and Extend sits inboard of it,
  // which is where a `dots-vertical` is looked for. Physical (not logical) positioning,
  // so the header controls keep the same arrangement under RTL.
  moreIcon: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  container: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    position: 'relative',
  },
  editIcon: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
  },
  extendIcon: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm + 44,
  },
  // Same slot the overflow would have occupied, used when the overflow is absent.
  extendIconAlone: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  // IconButton ships its own margin; the anchor wrapper now owns the placement.
  iconButtonReset: {
    margin: 0,
  },
  nameRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  nameText: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  tabBar: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
});
