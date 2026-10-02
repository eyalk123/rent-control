import { StyleSheet, TouchableOpacity, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useLanguageContext } from '@/src/core/context';
import { ICON_MD, spacing } from '@/src/core/theme';
import { Icon } from './Icon';

/**
 * The back arrow for the property and renter detail screens, which hide the stack header to
 * open on a hero. Absolutely positioned at the top of that hero, on the reading-start side:
 * left in LTR, right in RTL — the top corners are the only ones the hero's own actions leave
 * free. iOS has no hardware back, so without this the screen had no visible way out.
 *
 * `canGoBack` is false when the screen was opened cold (a notification, a deep link); the
 * list is the sensible place to land then rather than nowhere.
 */
export function DetailBackButton({
  fallbackHref,
  top,
  color,
  style,
}: {
  fallbackHref: string;
  top: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRtl } = useLanguageContext();

  return (
    <TouchableOpacity
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallbackHref as any))}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      style={[
        styles.button,
        // Logical `start`: the app flips with I18nManager, so this is the right edge in RTL.
        { top, start: spacing.sm },
        style,
      ]}
    >
      {/* Pick the glyph that already points the right way rather than mirroring one:
          react-native-svg clips to the viewport, so scaleX(-1) renders nothing on Android. */}
      <Icon name={isRtl ? 'chevron-right' : 'chevron-left'} size={ICON_MD} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    zIndex: 1,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
