import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { List, SegmentedButtons, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useThemeContext } from '@/src/context';
import { useLanguageContext } from '@/src/context';
import { ScreenContainer } from '@/src/components';
import { spacing } from '@/src/theme';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { themeMode, setThemeMode } = useThemeContext();
  const { language, setLanguage } = useLanguageContext();

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
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

        <Text variant="titleMedium" style={styles.sectionTitle}>
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
  sectionTitle: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  segmented: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  listItem: {
    paddingHorizontal: spacing.lg,
  },
});
