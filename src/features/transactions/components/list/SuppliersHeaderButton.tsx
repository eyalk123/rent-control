import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, ICON_LG, lightColors, spacing } from '@/src/core/theme';

interface SuppliersHeaderButtonProps {
  colors: typeof lightColors | typeof darkColors;
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
          <Text style={[styles.label, { color: colors.accent }]}>{label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    // Sits below the title row (~52pt: the settings gear's IconButton drives its height),
    // over the empty side of the hero — otherwise it covers the gear.
    top: spacing.xxl + spacing.xl + spacing.lg,
    right: spacing.lg,
  },
  btn: {
    width: 62,
    height: 68,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
