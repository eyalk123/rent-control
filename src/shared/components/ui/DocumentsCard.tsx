import { Linking } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors } from '@/src/core/theme';
import { Icon, type IconName } from './Icon';
import { DetailRow } from './DetailRow';
import { DetailSection } from './DetailSection';

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
    <DetailSection title={t('documents.title')}>
      {documents.map((doc) => (
        <DetailRow
          key={doc.url}
          // Kept: a document row is a thing you open, and the glyph says which kind.
          icon={doc.icon ?? 'file-text'}
          label={doc.label}
          onPress={() => Linking.openURL(doc.url)}
        >
          <Icon name="external-link" size={18} color={colors.textSecondary} />
        </DetailRow>
      ))}
    </DetailSection>
  );
}
