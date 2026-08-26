import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getRenterById,
  terminateLease,
  undoTermination,
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
import { TourAnchor } from '@/src/features/onboarding/AnchorRegistry';
import { useTour } from '@/src/features/onboarding/TourController';

type TabKey = 'info' | 'property' | 'transactions';

export function RenterDetailScreen() {
  // The Info tab is the default one, so the timeline anchor is mounted from the start;
  // the extend/end buttons only exist on a live lease, and on an ended one the anchor
  // wait simply times out and leaves the tour for the next renter.
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
  const [endLeaseOpen, setEndLeaseOpen] = useState(false);
  const [lifecyclePending, setLifecyclePending] = useState(false);

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
            <IconButton
              icon="pencil"
              iconColor="#FFF"
              size={20}
              style={[styles.editIcon, { backgroundColor: colors.primary }]}
              onPress={handleEdit}
              accessibilityLabel={t('renter.editRenter')}
            />
            {/* An ended lease has nothing left to extend; Edit stays, since a past
                tenancy's record can still need correcting. */}
            {/* The absolute positioning moves to the anchor wrapper: a wrapper View around
                an absolutely-positioned child would become its containing block and drag
                the button back into the flow. */}
            {!ended && (
              <TourAnchor id={ANCHORS.renterDetailExtend} style={styles.extendIcon}>
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
            {!ended && (
              <TourAnchor id={ANCHORS.renterDetailEndLease} style={styles.endLeaseIcon}>
                <IconButton
                  icon="calendar-remove"
                  iconColor="#FFF"
                  size={20}
                  style={[styles.iconButtonReset, { backgroundColor: colors.primary }]}
                  onPress={() => setEndLeaseOpen(true)}
                  accessibilityLabel={t('renter.endLease')}
                />
              </TourAnchor>
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

          {ended && (
            <View
              style={[
                styles.endedBanner,
                { backgroundColor: colors.inputFilledBackground, borderColor: colors.outline },
              ]}
            >
              <View style={styles.endedBannerText}>
                <Text variant="labelLarge" style={{ color: colors.textPrimary }}>
                  {terminated && renter.terminated_on
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
              {terminated && (
                <Button
                  mode="outlined"
                  compact
                  disabled={lifecyclePending}
                  onPress={handleReopenLease}
                >
                  {t('renter.reopenLease')}
                </Button>
              )}
            </View>
          )}

          {/* Tab bar */}
          <View style={[styles.tabBar, { backgroundColor: colors.inputBackground }]}>
            {([
              { value: 'info', label: t('renter.tabs.info') },
              { value: 'property', label: t('renter.tabs.property') },
              { value: 'transactions', label: t('renter.tabs.transactions') },
            ] as const).map((tab) => {
              const isActive = activeTab === tab.value;
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
          </View>
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {activeTab === 'info' && <RenterInfoTab renter={renter} />}
          {activeTab === 'property' && <RenterPropertyTab renter={renter} />}
          {activeTab === 'transactions' && (
            <RenterTransactionsTab
              renter={renter}
              state={txTabState}
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
  // Sits immediately inboard of the extend button, matching its physical (not
  // logical) positioning so the two stay a pair in both directions.
  endLeaseIcon: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm + 44,
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
    margin: 0,
  },
  extendIcon: {
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
