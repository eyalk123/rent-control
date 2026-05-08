import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTransactionById } from '@/src/features/transactions/api/transactions';
import { getApiErrorMessage } from '@/src/core/api/client';
import type { Transaction } from '@/src/shared/types';
import { Icon, LoadingOverlay, EmptyState, ScreenContainer } from '@/src/shared/components/ui';
import { darkColors, lightColors, spacing, ICON_MD } from '@/src/core/theme';
import { useLanguageContext } from '@/src/context';
import { formatDateFull } from '@/src/shared/utils/dates';
import { formatMoney } from '@/src/shared/utils/money';
import { monthYearLabel } from '@/src/features/transactions/utils/aggregate';

function InfoRow({
  label,
  value,
  iconName,
}: {
  label: string;
  value: string;
  iconName: import('@/src/shared/components/ui').IconName;
}) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Icon name={iconName} size={18} color={colors.textSecondary} />
        <Text variant="bodyMedium" style={[styles.infoLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
      </View>
      <Text variant="bodyMedium" style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

export function TransactionDetailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguageContext();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function fetchTransaction() {
        const numericId = Number(id);
        if (isNaN(numericId)) {
          setError(t('error.invalidTransactionId'));
          setLoading(false);
          return;
        }
        setLoading(true);
        setError(null);
        try {
          const data = await getTransactionById(numericId);
          setTransaction(data);
        } catch (err) {
          setError(getApiErrorMessage(err, t('error.loadFailed')));
        } finally {
          setLoading(false);
        }
      }
      fetchTransaction();
    }, [id, t])
  );

  const handleEdit = useCallback(() => {
    if (!transaction) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/transactions/edit/${transaction.id}` as any);
  }, [transaction, router]);

  const isRevenue = transaction?.type === 'revenue';
  const amountColor = isRevenue ? colors.revFg : colors.expFg;
  const amountBg = isRevenue ? colors.revBg : colors.expBg;
  const sign = isRevenue ? '+' : '−';

  const formatPaymentDate = (dateStr: string) => {
    if (!dateStr || dateStr.length < 10) return dateStr;
    const d = new Date(dateStr + 'T00:00:00');
    return formatDateFull(d, language);
  };

  const formatMonthFor = (monthFor: string) => {
    if (!monthFor || monthFor.length < 7) return monthFor;
    const key = monthFor.slice(0, 7) as any;
    return monthYearLabel(key, language === 'he' ? 'he-IL' : 'en-US');
  };

  const paymentMethodLabel = (method: string | null) => {
    if (!method) return '—';
    const suffix = method.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    return t(`transactions.paymentMethod${suffix}` as any, { defaultValue: method });
  };

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  if (error || !transaction) {
    return (
      <ScreenContainer>
        <EmptyState message={error ?? t('error.transactionNotFound')} icon="alert-circle" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['left', 'right', 'bottom']}>
      {/* Custom header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.xs,
            backgroundColor: theme.colors.surface,
            borderBottomColor: colors.outline,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          accessibilityLabel={t('common.back')}
        >
          <Icon name="chevron-left" size={ICON_MD} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {t('screens.transactionDetails')}
        </Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleEdit}
          accessibilityLabel={t('transactions.editTransaction')}
        >
          <Icon name="pencil" size={ICON_MD} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero: amount + type chip */}
        <View style={[styles.hero, { backgroundColor: amountBg }]}>
          <View style={[styles.typeBadge, { backgroundColor: theme.colors.surface }]}>
            <Icon
              name={isRevenue ? 'arrow-up-right' : 'arrow-down-right'}
              size={16}
              color={amountColor}
            />
            <Text variant="labelMedium" style={{ color: amountColor, fontWeight: '700' }}>
              {isRevenue ? t('transactions.typeRevenue') : t('transactions.typeExpense')}
            </Text>
          </View>
          <Text style={[styles.heroAmount, { color: amountColor }]}>
            {`‪${sign}${formatMoney(transaction.amount)}‬`}
          </Text>
        </View>

        {/* Detail card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}>
          <InfoRow
            label={t('transactions.property')}
            value={transaction.property_name}
            iconName="building"
          />
          <Divider style={{ marginVertical: spacing.xs }} />

          <InfoRow
            label={t('transactions.dateOfPayment')}
            value={formatPaymentDate(transaction.date_of_payment)}
            iconName="calendar"
          />

          {transaction.payment_method ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow
                label={t('transactions.paymentMethod')}
                value={paymentMethodLabel(transaction.payment_method)}
                iconName="credit-card"
              />
            </>
          ) : null}

          {isRevenue && transaction.month_for ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow
                label={t('transactions.monthForLabel')}
                value={formatMonthFor(transaction.month_for)}
                iconName="calendar-clock"
              />
            </>
          ) : null}

          {isRevenue && transaction.renter_name ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow
                label={t('transactions.renter')}
                value={transaction.renter_name}
                iconName="user"
              />
            </>
          ) : null}

          {!isRevenue && transaction.category_name ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow
                label={t('transactions.category')}
                value={t(`expenseCategories.${transaction.category_name.toLowerCase()}`, { defaultValue: transaction.category_name })}
                iconName="hash"
              />
            </>
          ) : null}

          {!isRevenue && transaction.supplier_name ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow
                label={t('transactions.supplier')}
                value={transaction.supplier_name}
                iconName="store"
              />
            </>
          ) : null}

          {transaction.notes ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow
                label={t('transactions.notes')}
                value={transaction.notes}
                iconName="file-text"
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  scroll: {
    padding: spacing.md,
    gap: spacing.md,
  },
  hero: {
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroAmount: {
    fontSize: 42,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    writingDirection: 'ltr',
  },
  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
    minWidth: 120,
  },
  infoLabel: {
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
});
