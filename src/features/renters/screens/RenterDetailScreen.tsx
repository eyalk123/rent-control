import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Linking, TouchableOpacity } from 'react-native';
import { Card, Text, useTheme, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { lightColors, darkColors } from '@/src/core/theme';
import { spacing } from '@/src/core/theme';

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

  const handleCall = () => {
    if (renter?.phone) Linking.openURL(`tel:${renter.phone}`);
  };

  const handleSms = () => {
    if (renter?.phone) Linking.openURL(`sms:${renter.phone}`);
  };

  const handleEmail = () => {
    if (renter?.email) Linking.openURL(`mailto:${renter.email}`);
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
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.primary }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text variant="titleMedium" style={styles.headerTitle}>
            {t('screens.renterDetails')}
          </Text>
          <TouchableOpacity onPress={handleEdit} hitSlop={12} style={styles.editHeaderBtn}>
            <MaterialCommunityIcons name="pencil" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileSection}>
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: 'rgba(255,255,255,0.3)' },
            ]}
          >
            <Text style={styles.avatarText}>
              {renter.first_name[0]}
              {renter.last_name[0]}
            </Text>
          </View>
          <Text variant="headlineSmall" style={styles.name}>
            {renter.first_name} {renter.last_name}
          </Text>
          <Text variant="bodyMedium" style={styles.propertyLine}>
            {renter.property?.address ?? t('renter.unassigned')}
          </Text>
        </View>
      </View>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card} mode="outlined">
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
            <Text variant="titleSmall" style={styles.sectionHeaderText}>
              {t('renter.leaseInfo')}
            </Text>
          </View>
          <Card.Content>
            <View style={styles.detailRow}>
              <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                {t('renter.rent')}
              </Text>
              <Text variant="bodyMedium">
                ${renter.monthly_rent.toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                {t('renter.dateOfStart')}
              </Text>
              <Text variant="bodyMedium">{renter.lease_start}</Text>
            </View>
            {renter.payment_day_of_month != null && (
              <View style={styles.detailRow}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('renter.dateOfPayment')}
                </Text>
                <Text variant="bodyMedium">{renter.payment_day_of_month}</Text>
              </View>
            )}
            {renter.number_of_payments != null && (
              <View style={styles.detailRow}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('renter.numberOfPayments')}
                </Text>
                <Text variant="bodyMedium">{renter.number_of_payments}</Text>
              </View>
            )}
            {renter.payment_type != null && renter.payment_type !== '' && (
              <View style={styles.detailRow}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('renter.paymentType')}
                </Text>
                <Text variant="bodyMedium">{renter.payment_type}</Text>
              </View>
            )}
            {renter.insurance_type != null && renter.insurance_type !== '' && (
              <View style={styles.detailRow}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('renter.insuranceType')}
                </Text>
                <Text variant="bodyMedium">{renter.insurance_type}</Text>
              </View>
            )}
            {renter.insurance_amount != null && (
              <View style={styles.detailRow}>
                <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                  {t('renter.insuranceAmount')}
                </Text>
                <Text variant="bodyMedium">{renter.insurance_amount.toLocaleString()}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="outlined">
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary }]}>
            <Text variant="titleSmall" style={styles.sectionHeaderText}>
              {t('renter.basicInfo')}
            </Text>
          </View>
          <Card.Content>
            <View style={styles.detailRow}>
              <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                {t('renter.phone')}
              </Text>
              <Text variant="bodyMedium">{renter.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text variant="labelSmall" style={{ color: colors.textSecondary }}>
                {t('renter.email')}
              </Text>
              <Text variant="bodyMedium">{renter.email}</Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonRow}>
          <Button
            mode="outlined"
            onPress={handleCall}
            icon="phone"
            style={styles.actionButton}
            compact
          >
            {t('renter.call')}
          </Button>
          <Button
            mode="outlined"
            onPress={handleSms}
            icon="message"
            style={styles.actionButton}
            compact
          >
            {t('renter.sms')}
          </Button>
          <Button
            mode="outlined"
            onPress={handleEmail}
            icon="email"
            style={styles.actionButton}
            compact
          >
            {t('renter.email')}
          </Button>
        </View>

        <Button
          mode="contained"
          onPress={handleEdit}
          style={styles.editButton}
          accessibilityLabel={t('renter.editRenter')}
          accessibilityRole="button"
        >
          {t('renter.editRenter')}
        </Button>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: spacing.lg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editHeaderBtn: {
    padding: spacing.xs,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  name: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  propertyLine: {
    color: 'rgba(255,255,255,0.9)',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    marginBottom: spacing.md,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionHeaderText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  editButton: {
    marginTop: spacing.xs,
  },
});
