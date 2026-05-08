import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { deleteMyAccount } from '@/src/features/settings/api/account';
import { ScreenContainer } from '@/src/shared/components/ui';
import { Icon } from '@/src/shared/components/ui';
import { spacing } from '@/src/core/theme';
import { useAlert } from '@/src/core/context';

const CONFIRM_WORD = 'DELETE';

export function DeleteAccountScreen() {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const router = useRouter();
  const theme = useTheme();
  const { deleteFirebaseAccount } = useAppAuth();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const isConfirmed = confirmText === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setLoading(true);
    try {
      // 1. Delete all backend data
      await deleteMyAccount();

      // 2. Delete Firebase Auth account
      await deleteFirebaseAccount();

      // 3. Clear local storage
      await AsyncStorage.multiRemove(['theme_mode', 'app_language']);

      // 4. Show success and navigate (auth guard will redirect to sign-in)
      appAlert('', t('settings.deleteAccountSuccess'), [
        { text: 'OK', onPress: () => router.replace('/(auth)/sign-in' as any) },
      ]);
    } catch (err: any) {
      setLoading(false);

      if (err?.code === 'auth/requires-recent-login') {
        appAlert(t('error.title'), t('settings.deleteAccountRequiresReauth'));
      } else {
        appAlert(t('error.title'), t('settings.deleteAccountFailed'));
      }
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
