import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { List, SegmentedButtons, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useThemeContext, useLanguageContext, useRtlLabelStyle } from '@/src/context';
import { ScreenContainer, LtrSection } from '@/src/shared/components/ui';
import { spacing } from '@/src/core/theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeContext();
  const { language, setLanguage } = useLanguageContext();
  const { signOut } = useAuth();
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        
        {/* 2. Move the Theme title OUTSIDE of LtrSection so it respects the global RTL layout */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, styles.themeTitle, rtlLabelStyle]}
        >
          {t('settings.theme')}
        </Text>

        {/* Keep LtrSection ONLY on the SegmentedButtons to preserve their order */}
        <LtrSection>
          <SegmentedButtons
            value={themeMode}
            onValueChange={(v) =>
              setThemeMode(v as 'light' | 'dark' | 'system')
            }
            buttons={[
              { value: 'light', label: t('settings.themeLight'), icon: 'white-balance-sunny' },
              { value: 'dark', label: t('settings.themeDark'), icon: 'moon-waning-crescent' },
              { value: 'system', label: t('settings.themeSystem'), icon: 'cellphone' },
            ]}
            style={styles.segmented}
          />
        </LtrSection>

        {/* 3. Apply the helper to the rest of your titles */}
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, rtlLabelStyle]}
        >
          {t('settings.suppliers')}
        </Text>
        <List.Section>
          <List.Item
            title={t('settings.suppliers')}
            left={(props) => <List.Icon {...props} icon="truck" />}
            onPress={() => router.push('/settings/suppliers' as any)}
            style={styles.listItem}
          />
        </List.Section>

        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, rtlLabelStyle]}
        >
          {t('settings.language')}
        </Text>
        <List.Section>
          <List.Item
            title={t('settings.languageEn')}
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) =>
              language === 'en' ? (
                <List.Icon {...props} icon="check" color={props.color} />
              ) : null
            }
            onPress={() => setLanguage('en')}
            style={styles.listItem}
          />
          <List.Item
            title={t('settings.languageHe')}
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) =>
              language === 'he' ? (
                <List.Icon {...props} icon="check" color={props.color} />
              ) : null
            }
            onPress={() => setLanguage('he')}
            style={styles.listItem}
          />
        </List.Section>

        <List.Section>
          <List.Item
            title="Sign out"
            left={(props) => <List.Icon {...props} icon="logout" />}
            onPress={() => signOut()}
            style={styles.listItem}
          />
        </List.Section>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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