import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRenterById } from '@/src/features/renters/api/renters';
import { getApiErrorMessage } from '@/src/core/api/client';
import type { Renter } from '@/src/shared/types';
import {
  LoadingOverlay,
  EmptyState,
  ScreenContainer,
} from '@/src/shared/components/ui';
import { lightColors, darkColors, spacing } from '@/src/core/theme';
import { RenterInfoTab } from '@/src/features/renters/components/RenterInfoTab';
import { RenterPropertyTab } from '@/src/features/renters/components/RenterPropertyTab';
import { RenterTransactionsTab } from '@/src/features/renters/components/RenterTransactionsTab';

type TabKey = 'info' | 'property' | 'transactions';

export function RenterDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const colors = theme.dark ? darkColors : lightColors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [renter, setRenter] = useState<Renter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('info');

  useEffect(() => {
    async function fetchRenter() {
      const numericId = Number(id);
      if (isNaN(numericId)) {
        setError(t('error.invalidRenterId'));
        setLoading(false);
        return;
      }
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
  }, [id, t]);

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (renter) {
      router.push(`/renters/edit/${renter.id}` as any);
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
          icon="account-alert"
        />
      </ScreenContainer>
    );
  }

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
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {renter.first_name[0]}
                {renter.last_name[0]}
              </Text>
            </View>
            <IconButton
              icon="pencil"
              iconColor="#FFF"
              size={20}
              style={[styles.editIcon, { backgroundColor: colors.primary }]}
              onPress={handleEdit}
              accessibilityLabel={t('renter.editRenter')}
            />
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
              {renter.property?.address ?? t('renter.unassigned')}
            </Text>
          </View>

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
            <RenterTransactionsTab renterId={renter.id} />
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    position: 'relative',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFF',
  },
  editIcon: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
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
