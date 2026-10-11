import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOUR_STATE_CACHE_KEY } from '@/src/features/onboarding/TourStateContext';
import { LEGAL_CONSENT_CACHE_KEY } from '@/src/features/legal/LegalConsentContext';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { isAppleCancel, reauthenticateAppleForDeletion, revokeAppleToken } from '@/src/core/auth/appleAuth';
import { deleteMyAccount } from '@/src/features/settings/api/account';
import { ScreenContainer } from '@/src/shared/components/ui';
import { Icon } from '@/src/shared/components/ui';
import { spacing } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';
import { useSubscription } from '@/src/features/subscription/SubscriptionContext';
import { manageSubscriptions } from '@/src/features/subscription/purchases';
import type { Subscription } from '@/src/features/subscription/types';

const CONFIRM_WORD = 'DELETE';

/**
 * What deleting the account does to a subscription still running. A web subscription is
 * cancelled by the server as part of the deletion. An App Store or Play subscription cannot
 * be cancelled by us and keeps charging unless the landlord cancels it in the store — so on
 * that store's own device the store's manage screen is one tap away.
 */
function subscriptionNotice(
  subscription: Subscription | null | undefined,
): { key: string; canOpenStore: boolean } | null {
  if (!subscription?.source || !subscription.status) return null;
  if (subscription.status === 'expired' || subscription.status === 'canceled') return null;
  if (subscription.source === 'paddle') return { key: 'settings.deleteAccountSubscriptionWeb', canOpenStore: false };
  if (subscription.source === 'apple' || subscription.source === 'google') {
    return {
      key: `settings.deleteAccountSubscriptionStore.${subscription.source}`,
      canOpenStore:
        (subscription.source === 'apple' && Platform.OS === 'ios') ||
        (subscription.source === 'google' && Platform.OS === 'android'),
    };
  }
  return null;
}

export function DeleteAccountScreen() {
  const { t, i18n } = useTranslation();
  const { appAlert } = useAlert();
  const router = useRouter();
  const theme = useTheme();
  const { signOut } = useAppAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const isConfirmed = confirmText === CONFIRM_WORD;
  const { subscription } = useSubscription();
  const notice = subscriptionNotice(subscription);

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    try {
      // 0. Apple accounts on iOS only: the Apple sheet, before anything is deleted, so
      //    cancelling it leaves the account whole. Yields the code Apple needs to revoke our
      //    tokens, and the revocation runs now because it needs the Firebase user to exist.
      const appleAuthorizationCode = await reauthenticateAppleForDeletion(i18n.language);
      await revokeAppleToken(appleAuthorizationCode);

      // 1. The backend deletes all data and then the Firebase sign-in itself — with the
      //    Admin SDK, which has no recent-login rule, so no fresh sign-in is asked for.
      await deleteMyAccount();

      // 2. The user is gone server-side; drop the local session that still holds it.
      await signOut();

      // 3. Clear local storage — what belongs to the account, not what belongs to the
      //    device. The tour and consent caches are copies of this owner's server
      //    records, so they go.
      //    Theme and language are this phone's settings and stay: they say nothing about
      //    who was signed in, and clearing the language flipped the UI and its direction
      //    out from under the success message below.
      await AsyncStorage.removeItem(TOUR_STATE_CACHE_KEY);
      await AsyncStorage.removeItem(LEGAL_CONSENT_CACHE_KEY);

      // 4. Show success and navigate (auth guard will redirect to sign-in)
      appAlert('', t('settings.deleteAccountSuccess'), [
        { text: 'OK', onPress: () => router.replace('/(auth)/sign-in' as any) },
      ]);
    } catch (err: any) {
      setLoading(false);

      if (isAppleCancel(err)) return;
      // The one refusal with its own message: the web subscription could not be
      // cancelled, so nothing was deleted and trying again is the right next step.
      const cancelFailed = err?.response?.data?.detail === 'subscription_cancel_failed';
      appAlert(
        t('error.title'),
        t(cancelFailed ? 'settings.deleteAccountCancelFailed' : 'settings.deleteAccountFailed'),
      );
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconRow}>
          <Icon name="alert-circle" size={48} color={theme.colors.error} />
        </View>

        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.error }]}>
          {t('settings.deleteAccountTitle')}
        </Text>

        <Text variant="bodyMedium" style={styles.warningLabel}>
          {t('settings.deleteAccountWarning')}
        </Text>
        <Text variant="bodyMedium" style={styles.warningItems}>
          {t('settings.deleteAccountWarningItems')}
        </Text>

        {notice && (
          <View style={[styles.notice, { borderColor: theme.colors.outline }]} accessibilityRole="text">
            <Text variant="bodyMedium" style={styles.noticeText}>
              {t(notice.key)}
            </Text>
            {notice.canOpenStore && (
              <Button mode="outlined" onPress={() => void manageSubscriptions()} style={styles.noticeButton}>
                {t('subscription.settings.manage')}
              </Button>
            )}
          </View>
        )}

        <View style={styles.divider} />

        <Text variant="labelLarge" style={styles.confirmLabel}>
          {t('settings.deleteAccountConfirmLabel')}
        </Text>
        <TextInput
          mode="outlined"
          value={confirmText}
          onChangeText={setConfirmText}
          placeholder={t('settings.deleteAccountConfirmPlaceholder')}
          autoCapitalize="characters"
          autoCorrect={false}
          style={styles.input}
          disabled={loading}
        />

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.error} style={styles.spinner} />
        ) : (
          <Button
            mode="contained"
            onPress={handleDelete}
            disabled={!isConfirmed}
            buttonColor={theme.colors.error}
            textColor={theme.colors.onError}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {t('settings.deleteAccountConfirmButton')}
          </Button>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  iconRow: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '700',
  },
  warningLabel: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  warningItems: {
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.md,
  },
  noticeText: { lineHeight: 21 },
  noticeButton: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: spacing.lg,
  },
  confirmLabel: {
    marginBottom: spacing.sm,
  },
  input: {
    marginBottom: spacing.xl,
  },
  button: {
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  spinner: {
    marginTop: spacing.xl,
  },
});
