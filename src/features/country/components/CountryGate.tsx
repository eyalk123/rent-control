/**
 * The blocking country screen, shown once.
 *
 * Same enforcement point as `LegalConsentGate`, for the same reason: **Continue with
 * Google** creates the Firebase account the moment the native sheet resolves, so there is
 * no point in the sign-up flow where a field could be required. A gate that runs *after*
 * authentication is the only thing that covers every way in.
 *
 * Every pre-existing account was backfilled to `IL`, so this never fires for them.
 *
 * **No country is ever refused.** Every ISO country is selectable and every user reaches a
 * working app. What varies is only how much country-specific machinery they get, and the
 * screen says so plainly — a stated absence reads as a roadmap, a silent one reads as a
 * broken product.
 *
 * An absolutely-positioned sibling of the navigator, like the consent gate, and it sits
 * just below it: terms are the condition of using the product at all, a country is a
 * setting within it, and asking where someone lives before they have agreed to anything is
 * the wrong order to collect it in.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Divider, List, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/src/core/theme';
import { useCountry } from '../CountryContext';
import type { Country } from '../api/countries';

/** Best guess from the device, always confirmable. Never a silent decision. */
function guessCountry(countries: Country[]): string | null {
  const known = new Set(countries.map((c) => c.countryCode));
  try {
    for (const locale of Localization.getLocales()) {
      const region = locale.regionCode?.toUpperCase();
      if (region && known.has(region)) return region;
    }
  } catch {
    // Localization can be unavailable in odd environments. Fall through to no guess.
  }
  return known.has('IL') ? 'IL' : null;
}

export function CountryGate() {
  const { blocked, countries, choose, finish, notifyMe } = useCountry();
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.colors;
  // The overlay is absoluteFillObject, so it covers the status bar and the gesture bar
  // too. Without these the title sits under the clock and the confirm button under the
  // home indicator — both confirmed on the emulator, and neither visible in the web
  // preview.
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Country | null>(null);
  const [notifyRequested, setNotifyRequested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const guess = useMemo(() => guessCountry(countries), [countries]);
  const value = selected ?? guess;
  const chosen = countries.find((c) => c.countryCode === value);

  // Swallow the hardware back button while blocked, so the user cannot navigate around
  // behind a screen they cannot see. Same approach as the consent gate.
  useEffect(() => {
    if (!blocked) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [blocked]);

  const onConfirm = useCallback(async () => {
    if (!chosen) return;
    setSaving(true);
    setError('');
    try {
      await choose(chosen.countryCode);
      // Israel is Tier N — the full product, nothing absent, nothing to disclose. It goes
      // straight in rather than being shown a screen that would have to say "everything is
      // available", which is noise.
      if (chosen.tier === 'native') finish(chosen.countryCode);
      else setConfirmed(chosen);
    } catch {
      // Only advance on a confirmed write: the country drives currency and formats, so
      // landing in the app without it stored would silently render as Israel.
      setError(t('country.saveError'));
    } finally {
      setSaving(false);
    }
  }, [chosen, choose, finish, t]);

  if (!blocked) return null;

  const overlay = [styles.overlay, { backgroundColor: colors.background }];

  if (countries.length === 0) {
    return (
      <View style={overlay} accessibilityViewIsModal accessibilityLabel={t('country.gateTitle')}>
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  // ── After choosing: say what is and isn't there, then get out of the way ──
  if (confirmed) {
    return (
      <View style={overlay} accessibilityViewIsModal accessibilityLabel={t('country.gateTitle')}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
          ]}
        >
          <Text variant="headlineSmall" style={[styles.title, { color: colors.onSurface }]}>
            {t('country.welcomeTitle', { country: confirmed.name })}
          </Text>

          {/*
            Promises currency and formats, deliberately *not* language: the app ships
            English and Hebrew only, and claiming a language it does not have is exactly the
            kind of overstatement that reads as a broken product on first contact.
          */}
          <Text variant="bodyMedium" style={[styles.body, { color: colors.onSurfaceVariant }]}>
            {t('country.skimmedNotice', {
              country: confirmed.name,
              currency: confirmed.currency,
            })}
          </Text>

          {/* One extra sentence where tenancies are usually open-ended. Nothing is blocked. */}
          {confirmed.openEndedTenancies ? (
            <Text variant="bodyMedium" style={[styles.body, { color: colors.onSurfaceVariant }]}>
              {t('country.openEndedNotice', { country: confirmed.name })}
            </Text>
          ) : null}

          <Button
            mode="outlined"
            disabled={notifyRequested}
            onPress={() => {
              notifyMe(confirmed.countryCode);
              setNotifyRequested(true);
            }}
            style={styles.button}
          >
            {notifyRequested
              ? t('country.notifyRequested')
              : t('country.notifyMe', { country: confirmed.name })}
          </Button>
          <Button
            mode="contained"
            onPress={() => finish(confirmed.countryCode)}
            style={styles.button}
          >
            {t('country.continue')}
          </Button>
        </ScrollView>
      </View>
    );
  }

  // ── Choosing ──
  return (
    <View style={overlay} accessibilityViewIsModal accessibilityLabel={t('country.gateTitle')}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <Text variant="headlineSmall" style={[styles.title, { color: colors.onSurface }]}>
          {t('country.gateTitle')}
        </Text>
        <Text variant="bodyMedium" style={[styles.body, { color: colors.onSurfaceVariant }]}>
          {t('country.gateSubtitle')}
        </Text>
      </View>

      {/*
        A scrolling list rather than a picker: ~250 options is past the point where a native
        picker wheel is usable, and the list keeps the chosen row visible while scrolling.
      */}
      <ScrollView style={styles.list}>
        {countries.map((c) => (
          <React.Fragment key={c.countryCode}>
            <List.Item
              title={c.name}
              onPress={() => {
                setSelected(c.countryCode);
                setError('');
              }}
              titleStyle={{ color: colors.onSurface }}
              right={(props) =>
                c.countryCode === value ? <List.Icon {...props} icon="check" /> : null
              }
            />
            <Divider />
          </React.Fragment>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {error ? (
          <Text variant="bodySmall" style={[styles.error, { color: colors.error }]}>
            {error}
          </Text>
        ) : null}
        <Button
          mode="contained"
          onPress={onConfirm}
          loading={saving}
          disabled={!chosen || saving}
          style={styles.button}
        >
          {t('country.confirm')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Just below LegalConsentGate (1500), which is itself below OfflineGate (2000): a
    // device with no connection has a more immediate problem, and consent comes before a
    // setting within the product.
    zIndex: 1400,
    elevation: 1400,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  list: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
  },
  body: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
  error: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
