import React from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, SegmentedButtons, Switch, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useNotifications } from '@/src/features/notifications/context/NotificationContext';
import { useThemeContext, useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { useCountry } from '@/src/features/country/CountryContext';
import { useAlert } from '@/src/core/context';
import { restartAppForRTL, type SupportedLanguage } from '@/src/core/i18n';
import { ScreenContainer, LtrSection } from '@/src/shared/components/ui';
import { Icon, type IconName } from '@/src/shared/components/ui';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { cardShadow, darkColors, lightColors, radii, spacing, useEntityColor, type EntityColor } from '@/src/core/theme';
import { AccountPreviewCard } from '../components/AccountPreviewCard';
import { TOURS_ENABLED } from '@/src/features/onboarding/flags';
import { useTourState } from '@/src/features/onboarding/TourStateContext';

// Generated from the notices file at web build time, so the app links to it rather than
// shipping its own copy.
const LICENSES_URL = 'https://rentvance.app/licenses';

// In-app browser first; if the system refuses (seen on an iOS review device), fall back
// to the default browser and swallow a second refusal rather than leave it unhandled.
function openLicenses() {
  WebBrowser.openBrowserAsync(LICENSES_URL).catch(() => Linking.openURL(LICENSES_URL).catch(() => {}));
}

function useSettingsColors() {
  const theme = useTheme();
  return theme.dark ? darkColors : lightColors;
}

/** The small uppercase heading above a group, as on Home. */
function SectionLabel({ label, style }: { label: string; style?: object }) {
  const colors = useSettingsColors();
  const rtlLabelStyle = useRtlLabelStyle();
  return (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }, rtlLabelStyle, style]}>
      {label.toUpperCase()}
    </Text>
  );
}

/** A card of rows under one heading. */
function SettingsGroup({ label, children }: { label?: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      {label ? <SectionLabel label={label} /> : null}
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>{children}</View>
    </View>
  );
}

/**
 * One row: the icon on its group's tint, the title and an optional line under it, and a
 * trailing control. Without `right` a tappable row ends in a chevron; `right={null}` leaves
 * the end empty (an action, not a page).
 */
function SettingsRow({
  icon,
  tint,
  title,
  titleColor,
  description,
  right,
  onPress,
  last = false,
}: {
  icon: IconName;
  tint: EntityColor;
  title: string;
  titleColor?: string;
  description?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const colors = useSettingsColors();
  const { isRtl } = useLanguageContext();
  const trailing =
    right !== undefined ? right : onPress ? (
      <Icon name={isRtl ? 'chevron-left' : 'chevron-right'} size={18} color={colors.textSecondary} />
    ) : null;
  const content = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: tint.bg }]}>
        <Icon name={icon} size={18} color={tint.fg} />
      </View>
      <View
        style={[
          styles.rowBody,
          !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outline },
        ]}
      >
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: titleColor ?? colors.textPrimary }]}>{title}</Text>
          {description ? (
            <Text style={[styles.rowDescription, { color: colors.textSecondary }]}>{description}</Text>
          ) : null}
        </View>
        {trailing}
      </View>
    </View>
  );
  if (!onPress) return content;
  return (
    <TouchableRipple onPress={onPress} accessibilityRole="button">
      {content}
    </TouchableRipple>
  );
}

export const SettingsScreen = React.memo(function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeContext();
  const { language, setLanguage, isRtl } = useLanguageContext();
  const { savePreferences } = useCountry();
  const { signOut } = useAppAuth();
  const { unregisterDevice } = useNotifications();
  const rtlLabelStyle = useRtlLabelStyle();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  // One color per group, from the same six as properties and renters.
  const sky = useEntityColor('sky');
  const plum = useEntityColor('plum');
  const olive = useEntityColor('olive');
  const mustard = useEntityColor('mustard');
  const indigo = useEntityColor('indigo');

  const { appAlert } = useAlert();
  const tourState = useTourState();

  // Switching between English and Hebrew flips the writing direction, but native views only
  // read that at launch — without a reload the navigation headers stay in the old direction
  // while everything else mirrors. Offer the restart, and if the reload isn't available in
  // this build, say so rather than appearing to do nothing. The two alerts must use different
  // copy — the first asks permission, the second asks for a manual restart — or the fallback
  // reads as the same alert firing twice (which is what it looks like in a dev client, where
  // restartAppForRTL always returns false).
  const handleLanguage = React.useCallback(
    async (lang: SupportedLanguage) => {
      const directionChanged = await setLanguage(lang);
      // Both, in this order: the device copy is what renders now, the account copy is
      // what follows the user to their next device. Before this was stored server-side,
      // signing in elsewhere silently reverted the choice. Best-effort — a failed write
      // must not block a language change that has already taken effect on screen.
      savePreferences({ language: lang }).catch(() => {});
      if (!directionChanged) return;
      appAlert(t('restart.title'), t('restart.confirmMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.continue'),
          onPress: async () => {
            const reloaded = await restartAppForRTL();
            if (!reloaded) appAlert(t('restart.title'), t('restart.manualMessage'));
          },
        },
      ]);
    },
    [setLanguage, savePreferences, appAlert, t],
  );

  // Reset is not undoable and puts every tour back in front of the user, so it asks first.
  const handleResetTours = React.useCallback(() => {
    appAlert(t('onboarding.ui.replayTitle'), t('onboarding.ui.replayBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('onboarding.ui.replayAction'),
        onPress: () => {
          tourState?.resetTours();
          appAlert(t('onboarding.ui.replayDone'));
        },
      },
    ]);
  }, [appAlert, t, tourState]);

  // Confirmed first: the row sits one tap away in a list of otherwise harmless settings, and
  // signing out drops any unsaved work and costs a full re-authentication to undo. The web
  // client asks the same question (SettingsPage `handleSignOut`).
  const handleSignOut = React.useCallback(() => {
    appAlert(t('settings.signOutConfirm'), t('settings.signOutConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.signOut'),
        style: 'destructive',
        onPress: async () => {
          // Unregister the push token while the auth token is still valid, then sign out.
          await unregisterDevice();
          await signOut();
        },
      },
    ]);
  }, [appAlert, t, unregisterDevice, signOut]);

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        <View style={styles.titleRow}>
          <IconButton
            icon={isRtl ? 'chevron-right' : 'chevron-left'}
            accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
            onPress={() => router.back()}
          />
          <Text variant="headlineLarge" style={[styles.pageTitle, rtlLabelStyle]}>
            {t('tabs.settings')}
          </Text>
        </View>
        <DevProfiler id="AccountPreviewCard">
          <AccountPreviewCard />
        </DevProfiler>

        <SectionLabel label={t('settings.theme')} style={styles.themeTitle} />

        {/* Keep LtrSection ONLY on the SegmentedButtons to preserve their order */}
        <DevProfiler id="SegmentedButtons">
        <LtrSection>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(v) =>
              setThemeMode(v as 'light' | 'dark' | 'system')
            }
            buttons={[
              { value: 'light',  label: t('settings.themeLight'),  icon: ({ color, size }: { color: string; size: number }) => <Icon name="sun"      size={size} color={color} /> },
              { value: 'dark',   label: t('settings.themeDark'),   icon: ({ color, size }: { color: string; size: number }) => <Icon name="moon"     size={size} color={color} /> },
              { value: 'system', label: t('settings.themeSystem'), icon: ({ color, size }: { color: string; size: number }) => <Icon name="settings" size={size} color={color} /> },
            ]}
            style={styles.segmented}
          />
        </LtrSection>
        </DevProfiler>

        <SettingsGroup label={t('settings.language')}>
          <SettingsRow
            icon="languages"
            tint={sky}
            title={t('settings.languageEn')}
            right={language === 'en' ? <Icon name="check" size={20} color={colors.primary} /> : null}
            onPress={() => handleLanguage('en')}
          />
          <SettingsRow
            icon="languages"
            tint={sky}
            title={t('settings.languageHe')}
            right={language === 'he' ? <Icon name="check" size={20} color={colors.primary} /> : null}
            onPress={() => handleLanguage('he')}
            last
          />
        </SettingsGroup>

        {/* Hidden entirely when the master switch is off (flags.ts): with no tours in the
            build there is nothing to replay and nothing to turn off, and offering the
            controls anyway would advertise a feature this build does not have. */}
        {TOURS_ENABLED && tourState && (
          <SettingsGroup label={t('onboarding.ui.sectionTitle')}>
            <SettingsRow
              icon="sparkles"
              tint={plum}
              title={t('onboarding.ui.replayTitle')}
              description={t('onboarding.ui.replayBody')}
              onPress={handleResetTours}
            />
            <SettingsRow
              icon="eye-off"
              tint={plum}
              title={t('onboarding.ui.disable')}
              right={
                <Switch
                  value={tourState.state.toursDisabled}
                  onValueChange={(v) => tourState.setToursDisabled(v)}
                  accessibilityLabel={t('onboarding.ui.disable')}
                />
              }
              last
            />
          </SettingsGroup>
        )}

        <SettingsGroup label={t('feedback.sectionTitle')}>
          <SettingsRow
            icon="message-circle"
            tint={olive}
            title={t('feedback.rowLabel')}
            description={t('feedback.rowHint')}
            onPress={() => router.push('/settings/feedback' as any)}
            last
          />
        </SettingsGroup>

        <SettingsGroup label={t('subscription.settings.title')}>
          <SettingsRow
            icon="wallet"
            tint={mustard}
            title={t('subscription.settings.rowLabel')}
            description={t('subscription.settings.rowHint')}
            onPress={() => router.push('/settings/plan' as any)}
            last
          />
        </SettingsGroup>

        <SettingsGroup label={t('legal.sectionTitle')}>
          <SettingsRow
            icon="shield"
            tint={indigo}
            title={t('legal.privacyPolicy')}
            onPress={() => router.push('/settings/legal/privacy' as any)}
          />
          <SettingsRow
            icon="file-text"
            tint={indigo}
            title={t('legal.termsOfService')}
            onPress={() => router.push('/settings/legal/terms' as any)}
          />
          <SettingsRow
            icon="eye"
            tint={indigo}
            title={t('legal.accessibility')}
            onPress={() => router.push('/settings/legal/accessibility' as any)}
          />
          <SettingsRow
            icon="file-text"
            tint={indigo}
            title={t('legal.openSourceLicenses')}
            right={<Icon name="external-link" size={16} color={colors.textSecondary} />}
            onPress={openLicenses}
            last
          />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow
            icon="door-open"
            tint={{ fg: colors.primary, bg: colors.primaryBg }}
            title={t('settings.signOut')}
            right={null}
            onPress={handleSignOut}
          />
          <SettingsRow
            icon="trash"
            tint={{ fg: theme.colors.error, bg: colors.expBg }}
            title={t('settings.deleteAccount')}
            titleColor={theme.colors.error}
            right={null}
            onPress={() => router.push('/settings/delete-account' as any)}
            last
          />
        </SettingsGroup>
      </ScrollView>
    </ScreenContainer>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageTitle: {
    fontWeight: '700',
    fontSize: 28,
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  themeTitle: {
    marginTop: spacing.xl,
  },
  sectionLabel: {
    marginHorizontal: spacing.lg + 4,
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  segmented: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  group: {
    marginBottom: spacing.lg,
  },
  card: {
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingStart: spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The divider runs under the text only, from the icon's edge to the card's.
  rowBody: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingEnd: spacing.md,
  },
  rowText: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
  },
  rowDescription: {
    fontSize: 13,
  },
});
