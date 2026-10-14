import type { NativeStackHeaderBackProps } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguageContext } from '@/src/core/context';
import { ICON_MD } from '@/src/core/theme';
import { Icon } from './Icon';

/**
 * `headerLeft` for the Settings and legal stacks, whose screens are also opened directly from
 * elsewhere (a plan upsell pushes `/settings/plans`, sign-in pushes `/legal/terms`). Then the
 * screen is the first in its stack and the native header draws no back button, and with iOS
 * swipe-back off there was no way out. Render nothing when the stack can go back, so the
 * native button stays in the usual case.
 */
export function headerExitLeft({ canGoBack, tintColor }: NativeStackHeaderBackProps) {
  return canGoBack ? null : <HeaderExitButton tintColor={tintColor} />;
}

function HeaderExitButton({ tintColor }: { tintColor?: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRtl } = useLanguageContext();

  return (
    <TouchableOpacity
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
    >
      <Icon name={isRtl ? 'chevron-right' : 'chevron-left'} size={ICON_MD} color={tintColor} />
    </TouchableOpacity>
  );
}
