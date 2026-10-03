/**
 * The "a newer version is available" dialog.
 *
 * Compares this build's store version against `GET /app-version` on launch and every time
 * the app returns to the foreground — apps sit resident for days, so launch alone would
 * miss most users. Two strengths:
 *
 *   - Older than `latest`: dismissible. "Later" is remembered per version, so the same
 *     release asks once rather than on every foreground; the next release asks again.
 *   - Older than `minimum`: not dismissible — no "Later", no tap-outside, no back button.
 *
 * Any failure (offline, server down, nothing configured) shows nothing. A version check
 * must never be the reason the app does not open.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Platform, StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguageContext, useThemeContext } from '@/src/core/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { getAppVersion } from '@/src/features/app-update/api/appVersion';
import { compareVersions } from '@/src/features/app-update/versionCompare';

const DISMISSED_KEY = 'appUpdate.dismissedVersion';

// Production store listings. Preview and dev builds have their own bundle ids but no listing,
// and pointing them here is fine: they never reach a real user.
const IOS_STORE_URL = 'https://apps.apple.com/app/id6779678079';
const ANDROID_PACKAGE = 'com.eyalk123.rentcontrol';
const ANDROID_MARKET_URL = `market://details?id=${ANDROID_PACKAGE}`;
const ANDROID_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

type Prompt = { forced: boolean; latest: string } | null;

async function openStore() {
  if (Platform.OS === 'ios') {
    await Linking.openURL(IOS_STORE_URL).catch(() => {});
    return;
  }
  // The market:// scheme opens the Play Store app directly; a device without it (some
  // emulators, de-Googled phones) falls back to the web listing.
  await Linking.openURL(ANDROID_MARKET_URL).catch(() =>
    Linking.openURL(ANDROID_WEB_URL).catch(() => {})
  );
}

export function UpdatePrompt() {
  const { t } = useTranslation();
  const { isRtl } = useLanguageContext();
  const { theme } = useThemeContext();
  const colors = theme.dark ? darkColors : lightColors;
  const [prompt, setPrompt] = useState<Prompt>(null);

  const check = useCallback(async () => {
    const current = Constants.expoConfig?.version;
    if (!current || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return;
    try {
      const { latest, minimum } = (await getAppVersion())[Platform.OS];
      if (minimum && compareVersions(current, minimum) < 0) {
        setPrompt({ forced: true, latest: latest ?? minimum });
        return;
      }
      if (latest && compareVersions(current, latest) < 0) {
        const dismissed = await AsyncStorage.getItem(DISMISSED_KEY).catch(() => null);
        setPrompt(dismissed === latest ? null : { forced: false, latest });
        return;
      }
      setPrompt(null);
    } catch {
      // Offline or server error: try again on the next foreground.
    }
  }, []);

  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  const onLater = useCallback(() => {
    if (!prompt || prompt.forced) return;
    AsyncStorage.setItem(DISMISSED_KEY, prompt.latest).catch(() => {});
    setPrompt(null);
  }, [prompt]);

  if (!prompt) return null;

  const rtlTextStyle = {
    textAlign: isRtl ? ('right' as const) : ('left' as const),
    writingDirection: isRtl ? ('rtl' as const) : ('ltr' as const),
  };

  return (
    <Portal>
      <Dialog
        visible
        dismissable={!prompt.forced}
        dismissableBackButton={!prompt.forced}
        onDismiss={onLater}
        style={[styles.dialog, { backgroundColor: colors.inputFilledBackground }]}
      >
        <Dialog.Title style={[styles.title, rtlTextStyle, { color: colors.textPrimary }]}>
          {t('appUpdate.title')}
        </Dialog.Title>
        <Dialog.Content>
          <Text
            variant="bodyMedium"
            style={[styles.message, rtlTextStyle, { color: colors.textSecondary }]}
          >
            {prompt.forced ? t('appUpdate.forcedMessage') : t('appUpdate.message')}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          {!prompt.forced && (
            <Button onPress={onLater} textColor={colors.textSecondary}>
              {t('appUpdate.later')}
            </Button>
          )}
          <Button mode="contained" onPress={openStore} style={styles.confirmButton}>
            {t('appUpdate.update')}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  message: {
    lineHeight: 22,
  },
  actions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  confirmButton: {
    marginLeft: spacing.xs,
  },
});
