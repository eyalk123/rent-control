import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, List, SegmentedButtons, Switch, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useNotifications } from '@/src/features/notifications/context/NotificationContext';
import { useThemeContext, useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { useAlert } from '@/src/core/context';
import { restartAppForRTL, type SupportedLanguage } from '@/src/core/i18n';
import { ScreenContainer, LtrSection } from '@/src/shared/components/ui';
import { Icon } from '@/src/shared/components/ui';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { spacing } from '@/src/core/theme';
import { AccountPreviewCard } from '../components/AccountPreviewCard';
import { TOURS_ENABLED } from '@/src/features/onboarding/flags';
import { useTourState } from '@/src/features/onboarding/TourStateContext';

export const SettingsScreen = React.memo(function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeContext();
  const { language, setLanguage, isRtl } = useLanguageContext();
  const { signOut } = useAppAuth();
  const { unregisterDevice } = useNotifications();
  const rtlLabelStyle = useRtlLabelStyle();
  const theme = useTheme();

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
    [setLanguage, appAlert, t],
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

  const handleSignOut = React.useCallback(async () => {
    // Unregister the push token while the auth token is still valid, then sign out.
    await unregisterDevice();
    await signOut();
  }, [unregisterDevice, signOut]);

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

        {/* 2. Move the Theme title OUTSIDE of LtrSection so it respects the global RTL layout */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, styles.themeTitle, rtlLabelStyle]}
        >
          {t('settings.theme')}
        </Text>

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

        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, rtlLabelStyle]}
        >
          {t('settings.language')}
        </Text>
        <List.Section>
          <List.Item
            title={t('settings.languageEn')}
            left={(props) => <Icon name="languages" size={20} color={props.color} style={props.style} />}
            right={(props) =>
              language === 'en' ? (
                <Icon name="check" size={20} color={props.color} style={props.style} />
              ) : null
            }
            onPress={() => handleLanguage('en')}
            style={styles.listItem}
          />
          <List.Item
            title={t('settings.languageHe')}
            left={(props) => <Icon name="languages" size={20} color={props.color} style={props.style} />}
            right={(props) =>
              language === 'he' ? (
                <Icon name="check" size={20} color={props.color} style={props.style} />
              ) : null
            }
            onPress={() => handleLanguage('he')}
            style={styles.listItem}
          />
        </List.Section>

        {/* Hidden entirely when the master switch is off (flags.ts): with no tours in the
            build there is nothing to replay and nothing to turn off, and offering the
            controls anyway would advertise a feature this build does not have. */}
        {TOURS_ENABLED && tourState && (
          <>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, rtlLabelStyle]}
            >
              {t('onboarding.ui.sectionTitle')}
            </Text>
            <List.Section>
              <List.Item
                title={t('onboarding.ui.replayTitle')}
                description={t('onboarding.ui.replayBody')}
                left={(props) => <Icon name="sparkles" size={20} color={props.color} />}
                onPress={handleResetTours}
                style={styles.listItem}
              />
              <List.Item
                title={t('onboarding.ui.disable')}
                left={(props) => <Icon name="eye-off" size={20} color={props.color} />}
                right={() => (
                  <Switch
                    value={tourState.state.toursDisabled}
                    onValueChange={(v) => tourState.setToursDisabled(v)}
                    accessibilityLabel={t('onboarding.ui.disable')}
                  />
                )}
                style={styles.listItem}
              />
            </List.Section>
          </>
        )}

        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, rtlLabelStyle]}
        >
          {t('legal.sectionTitle')}
        </Text>
        <List.Section>
          <List.Item
            title={t('legal.privacyPolicy')}
            left={(props) => <Icon name="shield" size={20} color={props.color} />}
            onPress={() => router.push('/settings/legal/privacy' as any)}
            style={styles.listItem}
          />
          <List.Item
            title={t('legal.termsOfService')}
            left={(props) => <Icon name="file-text" size={20} color={props.color} />}
            onPress={() => router.push('/settings/legal/terms' as any)}
            style={styles.listItem}
          />
          <List.Item
            title={t('legal.accessibility')}
            left={(props) => <Icon name="eye" size={20} color={props.color} />}
            onPress={() => router.push('/settings/legal/accessibility' as any)}
            style={styles.listItem}
          />
        </List.Section>

        <List.Section>
          <List.Item
            title={t('settings.signOut')}
            left={(props) => <Icon name="door-open" size={20} color={props.color} style={props.style} />}
            onPress={handleSignOut}
            style={styles.listItem}
          />
          <List.Item
            title={t('settings.deleteAccount')}
            titleStyle={{ color: theme.colors.error }}
            left={(props) => <Icon name="trash" size={20} color={theme.colors.error} style={props.style} />}
            onPress={() => router.push('/settings/delete-account' as any)}
            style={styles.listItem}
          />
        </List.Section>
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
  sectionTitle: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: '900',
    // alignSelf: 'stretch' has been removed! Your helper handles alignment elegantly.
  },
  segmented: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  listItem: {
    paddingHorizontal: spacing.lg,
  },
});