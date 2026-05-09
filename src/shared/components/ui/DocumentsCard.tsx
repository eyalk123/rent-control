import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { Icon, type IconName } from './Icon';

export interface DocumentItem {
  label: string;
  url: string;
  icon?: IconName;
}

interface DocumentsCardProps {
  documents: DocumentItem[];
}

export function DocumentsCard({ documents }: DocumentsCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  if (documents.length === 0) return null;

  return (
    <Card style={styles.card} mode="outlined">
      <View style={[styles.sectionHeader, { backgroundColor: colors.secondary }]}>
        <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: colors.onPrimary }]}>
          {t('documents.title')}
        </Text>
      </View>
      <Card.Content style={styles.cardContent}>
        {documents.map((doc) => (
          <TouchableOpacity
            key={doc.url}
            style={styles.row}
            onPress={() => Linking.openURL(doc.url)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Icon name={doc.icon ?? 'file-text'} size={20} color={colors.secondary} />
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                {doc.label}
              </Text>
            </View>
            <Icon name="external-link" size={18} color={colors.secondary} />
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
