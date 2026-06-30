import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/src/shared/components/ui';
import { spacing } from '@/src/core/theme';
import type { ReviewItem } from '../types';

/** Compact summary atop a prefilled form: how many fields the model was unsure about, listed
 *  as chips. The fields themselves are flagged inline (warning border + badge + source). */
export function ReviewBanner({ items }: { items?: ReviewItem[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  if (!items || items.length === 0) return null;
  return (
    <Surface
      elevation={0}
      style={[styles.banner, { backgroundColor: theme.colors.secondaryContainer, borderColor: theme.colors.outline }]}
    >
      <Icon name="alert-circle" size={18} color={theme.colors.onSecondaryContainer} />
      <View style={styles.body}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSecondaryContainer }}>
          {t('documentScan.reviewCount', { count: items.length })}
        </Text>
        <View style={styles.chips}>
          {items.map((item, i) => (
            <View
              key={`${item.formKey}-${i}`}
              style={[styles.chip, { borderColor: theme.colors.onSecondaryContainer }]}
            >
              <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
                {t(item.field, { defaultValue: item.field })}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  body: { flex: 1, gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
