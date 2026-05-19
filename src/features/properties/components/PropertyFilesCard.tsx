import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon } from '@/src/shared/components/ui';
import { getPropertyFiles } from '@/src/features/properties/api/propertyFilesApi';
import type { PropertyFile } from '@/src/shared/types';

interface PropertyFilesCardProps {
  propertyId: number;
}

export function PropertyFilesCard({ propertyId }: PropertyFilesCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const [files, setFiles] = React.useState<PropertyFile[]>([]);

  React.useEffect(() => {
    getPropertyFiles(propertyId)
      .then(setFiles)
      .catch(() => {});
  }, [propertyId]);

  if (files.length === 0) return null;

  return (
    <Card style={styles.card} mode="outlined">
      <View style={[styles.sectionHeader, { backgroundColor: colors.sectionAccent }]}>
        <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: colors.onPrimary }]}>
          {t('customFiles.sectionTitle')}
        </Text>
      </View>
      <Card.Content style={styles.cardContent}>
        {files.map((file) => (
          <TouchableOpacity
            key={file.id}
            style={styles.row}
            onPress={() => Linking.openURL(file.url)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Icon name="file-text" size={20} color={colors.sectionAccent} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                {file.label}
              </Text>
            </View>
            <Icon name="external-link" size={18} color={colors.sectionAccent} />
          </TouchableOpacity>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    borderRadius: 10,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sectionHeaderText: {
    fontWeight: '600',
  },
  cardContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
});
