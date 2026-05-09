import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/src/shared/components/ui';
import { ICON_LG, lightColors, spacing } from '@/src/core/theme';

interface SuppliersHeaderButtonProps {
  colors: typeof lightColors;
  onPress: () => void;
  label: string;
}

export function SuppliersHeaderButton({ colors, onPress, label }: SuppliersHeaderButtonProps) {
  const shadow = Platform.select({
    ios: {
      shadowColor: colors.primary,
      shadowOpacity: 0.4,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    },
    android: { elevation: 8 },
    default: {},
  });

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <View
        style={[styles.btn, shadow, { backgroundColor: colors.primary }]}
        renderToHardwareTextureAndroid
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Icon name="store" size={ICON_LG} color={colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: spacing.xxl,
    right: spacing.lg,
  },
  btn: {
    width: 52,
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
