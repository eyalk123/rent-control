import React from 'react';
import { IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

/** Persistent entry point to Settings, shown in every tab header now that Settings is no
 *  longer its own tab. It lives at the root (`app/settings/`), outside the tab navigator, so
 *  going back pops the stack and returns to the tab you came from. */
export function SettingsGearButton({ size = 24 }: { size?: number }) {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <IconButton
      icon="cog"
      size={size}
      accessibilityLabel={t('tabs.settings')}
      onPress={() => router.push('/settings' as any)}
    />
  );
}
