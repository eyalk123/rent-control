import React, { useCallback, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Divider, IconButton, Text, useTheme } from 'react-native-paper';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert, useOnReconnect } from '@/src/core/context';
import { useStoredFileUri } from '@/src/shared/hooks/useStoredFile';
import { localCopyOf, readsThroughSdk, storagePathOf } from '@/src/shared/utils/storedFile';
import { getTransactionById } from '@/src/features/transactions/api/transactions';
import { getApiErrorMessage } from '@/src/core/api/client';
import type { Transaction } from '@/src/shared/types';
import { ColorDot, Icon, InfoTip, LoadingOverlay, EmptyState, ScreenContainer } from '@/src/shared/components/ui';
import { darkColors, lightColors, spacing, ICON_MD, ICON_SM, useEntityColor } from '@/src/core/theme';
import { usePropertyContext } from '@/src/features/properties/context/PropertyContext';
import { PropertyThumb } from '@/src/features/properties/components/PropertyThumb';
import { propertyTypeLabelKey } from '@/src/features/properties/constants/propertyTypeLabel';
import { useLanguageContext, useRenterContext } from '@/src/context';
import { getLeaseEndDate } from '@/src/shared/types';
import { formatDateFull } from '@/src/shared/utils/dates';
import { formatMoney } from '@/src/shared/utils/money';
import { monthYearLabel } from '@/src/features/transactions/utils/aggregate';

/** A local copy of the receipt to share: read as the signed-in user, or — for a value that is
 *  not one of our files — downloaded from it. */
async function receiptLocalUri(value: string, filename: string): Promise<string> {
  if (readsThroughSdk(value)) return localCopyOf(storagePathOf(value)!);
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.downloadAsync(value, uri);
  return uri;
}

function InfoRow({
  label,
  value,
  info,
  children,
}: {
  label: string;
  value?: string;
  /** Explains an easily misread field, behind an (i) beside the label. */
  info?: string;
  /** Custom value content, e.g. the category chip. Takes precedence over `value`. */
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  return (
    <View style={styles.infoRow}>
      {/* No leading icon since the color redesign: the labels already say what each row is. */}
      <View style={styles.infoRowLeft}>
        <Text variant="bodyMedium" style={[styles.infoLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        {info ? <InfoTip label={t('common.aboutField', { label })}>{info}</InfoTip> : null}
      </View>
      {children ?? (
        <Text variant="bodyMedium" style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={3}>
          {/* A value that opens with a number ("15 Mar 2026 · Bit") would otherwise be laid
              out left to right in Hebrew, its parts read in reverse: Android takes a line's
              direction from its first strong character. The mark makes it start RTL. */}
          {isRtl && value ? `\u200F${value}` : value}
        </Text>
      )}
    </View>
  );
}

/**
 * The property the money belongs to, as a card in its color that opens it - the same card
 * the renter screen uses for "Lives at".
 */
function PropertyCardLink({ transaction }: { transaction: Transaction }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const { properties } = usePropertyContext();
  const property = properties.find((p) => p.id === transaction.property_id);
  const detail = property ? `${property.city} · ${t(propertyTypeLabelKey(property.type))}` : null;

  return (
    <TouchableOpacity
      disabled={transaction.property_id == null}
      onPress={() => router.push(`/properties/${transaction.property_id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={transaction.property_name}
      style={[styles.propertyCard, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}
    >
      <PropertyThumb
        property={property ? { ...property, color: transaction.property_color ?? property.color } : null}
        width={64}
        height={48}
        radius={10}
        iconSize={22}
      />
      <View style={styles.propertyText}>
        <View style={styles.propertyTitleRow}>
          <ColorDot color={transaction.property_color ?? property?.color} />
          <Text variant="bodyLarge" numberOfLines={1} style={[styles.propertyTitle, { color: colors.textPrimary }]}>
            {property?.address ?? transaction.property_name}
          </Text>
        </View>
        {detail ? (
          <Text variant="labelSmall" numberOfLines={1} style={{ color: colors.textSecondary }}>
            {detail}
          </Text>
        ) : null}
      </View>
      {transaction.property_id != null ? (
        <Icon name={isRtl ? 'chevron-left' : 'chevron-right'} size={ICON_SM} color={colors.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );
}

/**
 * Who paid, as a card in the renter's color that opens them - the revenue counterpart of the
 * property card above it. Falls back to the stored name, without a link, when the renter is
 * no longer in the list.
 */
function RenterCardLink({ transaction }: { transaction: Transaction }) {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl, language } = useLanguageContext();
  const { renters } = useRenterContext();
  const renter = renters.find((r) => r.id === transaction.renter_id);
  const itemColor = useEntityColor(renter?.color);
  const name = renter ? `${renter.first_name} ${renter.last_name}` : transaction.renter_name ?? '';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const leaseEnd = renter ? getLeaseEndDate(renter) : null;

  return (
    <TouchableOpacity
      disabled={!renter}
      onPress={() => router.push(`/renters/${transaction.renter_id}` as any)}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={[styles.propertyCard, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}
    >
      <View style={[styles.renterThumb, { backgroundColor: itemColor.bg }]}>
        <Text style={[styles.renterInitials, { color: itemColor.fg }]}>{initials}</Text>
      </View>
      <View style={styles.propertyText}>
        <Text variant="bodyLarge" numberOfLines={1} style={[styles.propertyTitle, { color: colors.textPrimary }]}>
          {name}
        </Text>
        {leaseEnd ? (
          <Text variant="labelSmall" numberOfLines={1} style={{ color: colors.textSecondary }}>
            {t('renter.leaseEnd', { date: formatDateFull(leaseEnd, language) })}
          </Text>
        ) : null}
      </View>
      {renter ? (
        <Icon name={isRtl ? 'chevron-left' : 'chevron-right'} size={ICON_SM} color={colors.textSecondary} />
      ) : null}
    </TouchableOpacity>
  );
}

export function TransactionDetailScreen() {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language, isRtl } = useLanguageContext();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [receiptFullscreen, setReceiptFullscreen] = useState(false);
  const receiptUri = useStoredFileUri(transaction?.receipt_image_url);

  const loadTransaction = useCallback(() => {
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
    }, [id, t]);
  useFocusEffect(loadTransaction);
  // The gate keeps this screen mounted, so lifting it would otherwise leave the failed load.
  useOnReconnect(loadTransaction);

  const handleShareReceipt = useCallback(async () => {
    if (!transaction?.receipt_image_url) return;
    try {
      const filename = 'receipt.jpg';
      const uri = await receiptLocalUri(transaction.receipt_image_url, filename);
      await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: filename });
    } catch {
      appAlert(t('error.title'), t('error.shareFailed', { defaultValue: 'Could not share receipt.' }));
    }
  }, [transaction, appAlert, t]);

  const handleEdit = useCallback(() => {
    if (!transaction) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/transactions/edit/${transaction.id}` as any);
  }, [transaction, router]);

  const categoryColor = useEntityColor(transaction?.category_color);
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
    if (!method) return '–';
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
          <Icon name={isRtl ? "chevron-right" : "chevron-left"} size={ICON_MD} color={theme.colors.onSurface} />
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

        <PropertyCardLink transaction={transaction} />
        {transaction.renter_id != null || transaction.renter_name ? (
          <RenterCardLink transaction={transaction} />
        ) : null}

        {/* Detail card */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}>
          {/* The month a rent pays for leads, as on the revenue form; "For month" says what
              it is without the tip the bare "Month" needed. */}
          {isRevenue && transaction.month_for ? (
            <>
              <InfoRow
                label={t('transactions.forMonth')}
                value={formatMonthFor(transaction.month_for)}
              />
              <Divider style={{ marginVertical: spacing.xs }} />
            </>
          ) : null}

          {/* Date and method on one line: two short facts about the same event. */}
          <InfoRow
            label={t('transactions.paid')}
            value={
              transaction.payment_method
                ? `${formatPaymentDate(transaction.date_of_payment)} · ${paymentMethodLabel(transaction.payment_method)}`
                : formatPaymentDate(transaction.date_of_payment)
            }
          />

          {/* What the lease asked for against what came in. Calm either way: a shortfall is
              stated, not flagged. */}
          {isRevenue && transaction.expected_amount != null ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow
                label={t('transactions.expected')}
                value={
                  transaction.amount >= transaction.expected_amount
                    ? t('transactions.expectedPaidInFull', { amount: formatMoney(transaction.expected_amount) })
                    : t('transactions.expectedShort', {
                        amount: formatMoney(transaction.expected_amount),
                        diff: formatMoney(transaction.expected_amount - transaction.amount),
                      })
                }
              />
            </>
          ) : null}

          {!isRevenue && transaction.category_name ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow label={t('transactions.category')}>
                {/* The category's own color, the same chip it wears in the expense form. */}
                <View style={[styles.categoryChip, { backgroundColor: categoryColor.bg }]}>
                  <Text variant="labelLarge" style={{ color: categoryColor.fg }} numberOfLines={1}>
                    {t(`expenseCategories.${transaction.category_name.toLowerCase()}`, { defaultValue: transaction.category_name })}
                  </Text>
                </View>
              </InfoRow>
            </>
          ) : null}

          {!isRevenue && transaction.supplier_name ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow
                label={t('transactions.supplier')}
                value={transaction.supplier_name}
              />
            </>
          ) : null}

          {transaction.notes ? (
            <>
              <Divider style={{ marginVertical: spacing.xs }} />
              <InfoRow
                label={t('transactions.notes')}
                value={transaction.notes}
              />
            </>
          ) : null}
        </View>

        {!isRevenue && transaction.receipt_image_url ? (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: colors.outline }]}>
            <View style={styles.receiptHeader}>
              <Icon name="receipt" size={16} color={colors.textSecondary} />
              <Text variant="labelMedium" style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                {t('transactions.receiptImage', { defaultValue: 'Receipt Photo' })}
              </Text>
              <IconButton
                icon="share-variant"
                size={18}
                onPress={handleShareReceipt}
                style={styles.shareBtn}
              />
            </View>
            <Pressable onPress={() => setReceiptFullscreen(true)}>
              <Image
                source={receiptUri ? { uri: receiptUri } : undefined}
                style={styles.receiptImage}
                contentFit="contain"
              />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={receiptFullscreen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setReceiptFullscreen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={[styles.modalCloseBtn, { top: insets.top + 12 }]}
            onPress={() => setReceiptFullscreen(false)}
            accessibilityLabel={t('common.close')}
          >
            <Icon name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.modalImageContainer}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          >
            <Image
              source={receiptUri ? { uri: receiptUri } : undefined}
              style={styles.modalImage}
              contentFit="contain"
            />
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  renterThumb: {
    width: 64,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renterInitials: {
    fontSize: 17,
    fontWeight: '700',
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  propertyText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  propertyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyTitle: {
    flexShrink: 1,
    fontWeight: '600',
  },
  categoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 1,
  },
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
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  receiptLabel: {
    flex: 1,
    fontWeight: '600',
  },
  shareBtn: {
    margin: 0,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
