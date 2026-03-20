import React from 'react';
import {
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { lightColors, darkColors, spacing } from '@/src/core/theme';

export type ContactActionsRowProps = {
  phone?: string | null;
  email?: string | null;
  variant?: 'default' | 'compact';
  /** Row `justifyContent` for the action circles */
  contentAlign?: 'center' | 'flex-start' | 'flex-end';
  style?: StyleProp<ViewStyle>;
};

type CircleProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  backgroundColor: string;
  iconColor: string;
  onPress: () => void;
  variant: 'default' | 'compact';
};

function ContactActionCircle({
  icon,
  label,
  backgroundColor,
  iconColor,
  onPress,
  variant,
}: CircleProps) {
  const isCompact = variant === 'compact';
  const size = isCompact ? 36 : 48;
  const iconSize = isCompact ? 18 : 22;

  if (isCompact) {
    return (
      <TouchableOpacity
        style={[styles.compactCircle, { backgroundColor, width: size, height: size, borderRadius: size / 2 }]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.actionCircleWrapper} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionCircle, { backgroundColor, width: size, height: size, borderRadius: size / 2 }]}>
        <MaterialCommunityIcons name={icon} size={iconSize} color={iconColor} />
      </View>
      <Text variant="labelSmall" style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function ContactActionsRow({
  phone,
  email,
  variant = 'default',
  contentAlign = 'center',
  style,
}: ContactActionsRowProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  const phoneTrim = phone?.trim() ?? '';
  const emailTrim = email?.trim() ?? '';
  const hasPhone = phoneTrim.length > 0;
  const hasEmail = emailTrim.length > 0;

  if (!hasPhone && !hasEmail) {
    return null;
  }

  const gap = variant === 'compact' ? spacing.sm : spacing.xl;

  return (
    <View
      style={[
        styles.actionsRow,
        { justifyContent: contentAlign, gap },
        style,
      ]}
    >
      {hasPhone ? (
        <ContactActionCircle
          icon="phone"
          label={t('contact.call')}
          backgroundColor={colors.chooseRevenueBg}
          iconColor={colors.chooseRevenueIcon}
          onPress={() => Linking.openURL(`tel:${phoneTrim}`)}
          variant={variant}
        />
      ) : null}
      {hasPhone ? (
        <ContactActionCircle
          icon="message-text"
          label={t('contact.sms')}
          backgroundColor="rgba(29, 78, 216, 0.15)"
          iconColor={colors.primary}
          onPress={() => Linking.openURL(`sms:${phoneTrim}`)}
          variant={variant}
        />
      ) : null}
      {hasEmail ? (
        <ContactActionCircle
          icon="email"
          label={t('contact.email')}
          backgroundColor="rgba(13, 148, 136, 0.15)"
          iconColor={colors.secondary}
          onPress={() => Linking.openURL(`mailto:${emailTrim}`)}
          variant={variant}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionCircleWrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontWeight: '500',
  },
});
