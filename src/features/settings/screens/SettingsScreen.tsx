import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { List, SegmentedButtons, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/src/context';
import { useLanguageContext } from '@/src/context';
import { ScreenContainer, LtrSection } from '@/src/shared/components/ui';
import { spacing } from '@/src/core/theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { themeMode, setThemeMode } = useThemeContext();
  const { language, setLanguage, isRtl } = useLanguageContext();

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        <LtrSection style={styles.themeSection}>
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, isRtl && styles.sectionTitleRtl]}
          >
            {t('settings.theme')}
          </Text>
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

        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, isRtl && styles.sectionTitleRtl]}
        >
          {t('settings.language')}
        </Text>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, isRtl && styles.sectionTitleRtl]}
        >
          {t('settings.suppliers')}
        </Text>
        <List.Section>
          <List.Item
            title={t('settings.suppliers')}
            left={(props) => <List.Icon {...props} icon="truck" />}
            onPress={() => router.push('/settings/suppliers')}
            style={styles.listItem}
          />
        </List.Section>

        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, isRtl && styles.sectionTitleRtl]}
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
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  sectionTitleRtl: {
    textAlign: 'right',
  },
  segmented: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  listItem: {
    paddingHorizontal: spacing.lg,
  },
});
