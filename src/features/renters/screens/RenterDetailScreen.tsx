import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Menu, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  getRenterById,
  terminateLease,
  undoTermination,
  updateRenter,
} from '@/src/features/renters/api/renters';
import { getApiErrorMessage } from '@/src/core/api/client';
import {
  LockedPropertyState,
  isPropertyLockedError,
} from '@/src/features/subscription/components/LockedPropertyState';
import type { Renter } from '@/src/shared/types';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import {
  BandButton,
  ColorBand,
  ColorDot,
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
  DetailTabBar,
} from '@/src/shared/components/ui';
import { lightColors, darkColors, spacing, useEntityColor } from '@/src/core/theme';
import { RenterAvatar } from '@/src/features/renters/components/RenterAvatar';
import { EndLeaseDialog } from '@/src/features/renters/components/EndLeaseDialog';
import { ExerciseOptionDialog } from '@/src/features/renters/components/ExerciseOptionDialog';
import { getRenterLifecycle, isOpenEnded, isTerminated } from '@/src/shared/utils/renterStatus';
import { formatDateFull, parseISODate } from '@/src/shared/utils/dates';
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
import { useOnReconnect } from '@/src/core/context';

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
  const colors = theme.dark ? darkColors : lightColors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [renter, setRenter] = useState<Renter | null>(null);
  // Above the early returns: it is a hook.
  const itemColor = useEntityColor(renter?.color);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // A renter on a property over the plan's limit is refused like the property itself.
  const [locked, setLocked] = useState(false);
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
  const [exerciseOptionOpen, setExerciseOptionOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [lifecyclePending, setLifecyclePending] = useState(false);
  const [linkPending, setLinkPending] = useState(false);

  const loadRenter = useCallback(() => {
      async function fetchRenter() {
        const numericId = Number(id);
        if (isNaN(numericId)) {
          setError(t('error.invalidRenterId'));
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        setLocked(false);
        try {
          const data = await getRenterById(numericId);
          setRenter(data);
        } catch (err) {
          if (isPropertyLockedError(err)) setLocked(true);
          else setError(getApiErrorMessage(err, t('error.loadFailed')));
        } finally {
          setLoading(false);
        }
      }
      fetchRenter();
    }, [id, t]);
  useFocusEffect(loadRenter);
  // The gate keeps this screen mounted, so lifting it would otherwise leave the failed load.
  useOnReconnect(loadRenter);

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

  if (locked) {
    return (
      <ScreenContainer>
        <LockedPropertyState />
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
  const openEnded = isOpenEnded(renter);
  // A lease that simply ran its term is the canonical thing you renew, and the tenant
  // routinely stays on while the paperwork catches up — so Extend survives expiry. A
  // *terminated* lease is different: the owner has declared the tenancy over, so the
  // honest move is Reopen first. Extending it would silently un-end it.
  const canExtend = !terminated;

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header: the same color band the property screen opens on, in the renter's color,
            holding their initials where the property holds its picture. */}
        <View>
          <ColorBand
            color={renter.color}
            fallbackHref="/renters"
            height={170}
            align="center"
            actions={
              <>
                {/* Edit stays on an ended lease, since a past tenancy's record can still need
                    correcting - and so does Extend, unless the lease was terminated. */}
                {canExtend && (
                  <TourAnchor id={ANCHORS.renterDetailExtend}>
                    <BandButton
                      icon="calendar-plus"
                      onPress={handleExtend}
                      accessibilityLabel={t('renter.extendLease')}
                    />
                  </TourAnchor>
                )}
                <TourAnchor id={ANCHORS.renterDetailEdit}>
                  <BandButton
                    icon="pencil"
                    onPress={handleEdit}
                    accessibilityLabel={t('renter.editRenter')}
                  />
                </TourAnchor>
                {/* End lease lives behind the overflow rather than beside Extend: as two
                    icon buttons, calendar-plus and calendar-remove read as a pair, and the
                    menu gives End lease the text label an icon cannot have. Not styled
                    destructive, for the reason the web hero notes: dressing it like Delete
                    pushes people into rewriting the lease term by hand instead. */}
                {!ended && (
                  <Menu
                    visible={moreOpen}
                    onDismiss={() => setMoreOpen(false)}
                    // Drops from under the button rather than over it.
                    anchorPosition="bottom"
                    anchor={
                      <TourAnchor id={ANCHORS.renterDetailMore}>
                        <BandButton
                          icon="more-vertical"
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
                )}
              </>
            }
          >
            <RenterAvatar
              renter={renter}
              size={96}
              radius={28}
              backgroundColor={colors.surface}
              textColor={itemColor.fg}
              style={styles.avatar}
            />
          </ColorBand>

          <View style={styles.nameRow}>
            <Text
              variant="headlineSmall"
              style={[styles.nameText, { color: colors.textPrimary }]}
            >
              {renter.first_name} {renter.last_name}
            </Text>
            <View style={styles.subtitleRow}>
              {/* The dot is the property's color, not the renter's: it marks where they live. */}
              {renter.property ? <ColorDot color={renter.property.color} size={9} /> : null}
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                {renter.property ? `${renter.property.address}${formatFloorApartment(renter.property, t)}` : t('renter.unassigned')}
              </Text>
            </View>
          </View>

          {/* Two treatments, split by whether there is anything to act on.
              A plainly expired lease is metadata, so it reads as a chip that continues the
              centred name block above it. A *terminated* one carries a date, often a reason
              and always a Reopen action, which earns the full banner. Using the banner for
              both left the expired case as a full-width bordered box with one short
              left-aligned line and a large empty right half. */}
          {/*
            A third case in the same row. Unlike the two below it this is not a lifecycle
            state — the lease is perfectly live — but it belongs here because it answers the
            same question the others do: what kind of tenancy am I looking at. Mobile has no
            "lease ends in" stat to replace, so without this the screen says nothing at all
            about a lease whose end date the server keeps moving.
          */}
          {!ended && openEnded && (
            <View style={styles.statusChipRow}>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: colors.inputFilledBackground, borderColor: colors.outline },
                ]}
              >
                <Text variant="labelMedium" style={{ color: colors.textSecondary }}>
                  {t('renter.openEndedShort')}
                </Text>
              </View>
            </View>
          )}

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
                        date: formatDateFull(parseISODate(renter.terminated_on)!, language),
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
          <DetailTabBar
            anchorId={ANCHORS.renterDetailTabs}
            value={shownTab}
            onChange={setActiveTab}
            tabs={[
              { value: 'info', label: t('renter.tabs.info') },
              { value: 'property', label: t('renter.tabs.property') },
              { value: 'transactions', label: t('renter.tabs.transactions') },
            ]}
          />
        </View>

        {/* Tab content */}
        <View ref={panelAnchorRef} collapsable={false} style={styles.tabContent}>
          {shownTab === 'info' && (
            <RenterInfoTab renter={renter} onExerciseOption={() => setExerciseOptionOpen(true)} />
          )}
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
      <ExerciseOptionDialog
        renter={exerciseOptionOpen ? renter : null}
        onDismiss={() => setExerciseOptionOpen(false)}
        onSaved={setRenter}
        onChangeTerms={() => {
          setExerciseOptionOpen(false);
          handleExtend();
        }}
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
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg + spacing.xs,
    marginTop: spacing.xs,
  },
  // Shrinks to its text rather than stretching, so there is no empty half to explain.
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
  },
  container: {
    flex: 1,
  },
  // Sits a little low in the band, clear of the round buttons along its top.
  avatar: {
    marginTop: spacing.md,
  },
  // Start-aligned, like the property screen's title under its band.
  nameRow: {
    paddingHorizontal: spacing.lg + spacing.xs,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
  },
  nameText: {
    fontWeight: '700',
    textAlign: 'left',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabContent: {
    flex: 1,
  },
});
