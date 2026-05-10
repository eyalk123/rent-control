import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { List, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { useThemeContext, useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { ScreenContainer, LtrSection } from '@/src/shared/components/ui';
import { Icon } from '@/src/shared/components/ui';
import { DevProfiler } from '@/src/shared/components/dev/DevProfiler';
import { spacing } from '@/src/core/theme';
import { AccountPreviewCard } from '../components/AccountPreviewCard';

export const SettingsScreen = React.memo(function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeContext();
  const { language, setLanguage } = useLanguageContext();
  const { signOut } = useAppAuth();
  const rtlLabelStyle = useRtlLabelStyle();
  const theme = useTheme();

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        <Text variant="headlineLarge" style={[styles.pageTitle, rtlLabelStyle]}>
          {t('tabs.settings')}
        </Text>
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
            onPress={() => setLanguage('en')}
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
            onPress={() => setLanguage('he')}
            style={styles.listItem}
          />
        </List.Section>

        <List.Section>
          <List.Item
            title={t('settings.signOut')}
            left={(props) => <Icon name="door-open" size={20} color={props.color} style={props.style} />}
            onPress={() => signOut()}
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
  pageTitle: {
    fontWeight: '700',
    fontSize: 28,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
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