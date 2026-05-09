import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Icon, type IconName } from './Icon';
import { spacing } from '@/src/core/theme';

interface IconDetailRowProps {
  icon: IconName;
  label: string;
  value: string;
  iconColor: string;
  secondaryColor: string;
}

export function IconDetailRow({ icon, label, value, iconColor, secondaryColor }: IconDetailRowProps) {
  return (
    <View style={styles.iconRow}>
      <View style={styles.iconRowLeft}>
        <Icon name={icon} size={20} color={iconColor} />
        <Text variant="bodyMedium" style={{ color: secondaryColor }}>
          {label}
        </Text>
      </View>
      <Text variant="bodyMedium" style={styles.iconRowValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  iconRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  iconRowValue: {
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 0,
  },
});
