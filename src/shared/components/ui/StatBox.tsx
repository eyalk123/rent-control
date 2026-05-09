import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Icon, type IconName } from './Icon';
import { spacing } from '@/src/core/theme';

type TextVariant =
  | 'displayLarge' | 'displayMedium' | 'displaySmall'
  | 'headlineLarge' | 'headlineMedium' | 'headlineSmall'
  | 'titleLarge' | 'titleMedium' | 'titleSmall'
  | 'bodyLarge' | 'bodyMedium' | 'bodySmall'
  | 'labelLarge' | 'labelMedium' | 'labelSmall';

interface StatBoxProps {
  icon: IconName;
  value: string;
  label: string;
  backgroundColor: string;
  iconColor: string;
  textColor: string;
  secondaryColor: string;
  valueVariant?: TextVariant;
}

export function StatBox({
  icon,
  value,
  label,
  backgroundColor,
  iconColor,
  textColor,
  secondaryColor,
  valueVariant = 'bodyLarge',
}: StatBoxProps) {
  return (
    <View style={[styles.statBox, { backgroundColor }]}>
      <Icon name={icon} size={24} color={iconColor} />
      <Text variant={valueVariant} style={[styles.statValue, { color: textColor }]}>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: secondaryColor }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    gap: 2,
  },
  statValue: {
    fontWeight: '700',
  },
});
