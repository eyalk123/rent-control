/**
 * The "you have no connection" blocker.
 *
 * This app is a thin client over the API with no local store, so with no connection every
 * screen is empty or wrong. One honest screen beats nine screens failing in nine ways — and
 * it heads off the worst reaction available to the user, which is seeing an empty portfolio
 * and wondering whether their data is gone.
 *
 * An absolutely-positioned sibling of the navigator inside DirectionalContent, NOT a Modal
 * and NOT a route. Two things follow from that, both deliberate:
 *
 *   - The screen underneath stays mounted, so a half-filled Add Property form survives a
 *     tunnel. Replacing the route would throw the user's typing away.
 *   - It sits above the tab bar too, since it is a sibling of the whole navigator rather
 *     than of a screen inside it.
 *
 * See TourOverlay's header for the longer argument against Modal on Android — it is its own
 * window, with its own origin and its own edge-to-edge behaviour.
 *
 * Only device-level connectivity gets you here. A reachable network with an unreachable
 * backend is a different failure and keeps its own per-screen message, because telling
 * someone to check their wifi while their wifi is fine sends them to fix the wrong thing.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { useNetwork } from '@/src/core/context';
import { Icon } from './Icon';

export function OfflineGate() {
  const { isOffline, recheck } = useNetwork();
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [checking, setChecking] = useState(false);

  // Swallow the hardware back button while blocked, so the user cannot navigate around
  // behind a screen they cannot see. Same approach as TourOverlay.
  useEffect(() => {
    if (!isOffline) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [isOffline]);

  const onRetry = useCallback(async () => {
    setChecking(true);
    try {
      // NetInfo answers almost instantly, so without a floor the spinner never renders and
      // a still-offline retry looks like a dead button.
      await Promise.all([recheck(), new Promise((r) => setTimeout(r, 600))]);
    } finally {
      setChecking(false);
    }
  }, [recheck]);

  if (!isOffline) return null;

  return (
    <View
      style={[styles.overlay, { backgroundColor: theme.colors.background }]}
      accessibilityViewIsModal
      accessibilityLabel={t('offline.title')}
    >
      <Icon name="wifi-off" size={56} color={colors.placeholder} strokeWidth={1.5} />
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        {t('offline.title')}
      </Text>
      <Text variant="bodyMedium" style={[styles.body, { color: colors.textSecondary }]}>
        {t('offline.body')}
      </Text>
      <Button
        mode="contained"
        onPress={onRetry}
        loading={checking}
        disabled={checking}
        style={styles.button}
      >
        {t('common.tryAgain')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    // Above the tour overlay, which is the only other sibling drawing over the navigator.
    zIndex: 2000,
    elevation: 2000,
  },
  title: {
    marginTop: spacing.lg,
    textAlign: 'center',
    fontWeight: '700',
  },
  body: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
});
