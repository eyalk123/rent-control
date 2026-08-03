import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useRtlLabelStyle } from '@/src/context';
import { ScreenContainer } from '@/src/shared/components/ui';
import { spacing } from '@/src/core/theme';
import type { LegalDoc } from '../legalContent';

/**
 * Renders one legal document (privacy / terms / accessibility).
 *
 * The web app's equivalent (`LegalLayout`) also draws a header and a language switcher; here the
 * Stack header and the global language setting cover both, so this is body text only.
 */
export function LegalDocumentView({ doc }: { doc: LegalDoc }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <ScreenContainer edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={[styles.title, rtlLabelStyle]}>
          {doc.title}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.updated, rtlLabelStyle, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('legal.lastUpdated')}: {doc.lastUpdated}
        </Text>

        {doc.intro.map((paragraph, i) => (
          <Text key={`intro-${i}`} variant="bodyMedium" style={[styles.paragraph, rtlLabelStyle]}>
            {paragraph}
          </Text>
        ))}

        {doc.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text variant="titleMedium" style={[styles.heading, rtlLabelStyle]}>
              {section.heading}
            </Text>
            {section.paragraphs?.map((paragraph, i) => (
              <Text key={`p-${i}`} variant="bodyMedium" style={[styles.paragraph, rtlLabelStyle]}>
                {paragraph}
              </Text>
            ))}
            {section.bullets?.map((bullet, i) => (
              <Text key={`b-${i}`} variant="bodyMedium" style={[styles.bullet, rtlLabelStyle]}>
                {'•  '}
                {bullet}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  updated: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.xl,
  },
  heading: {
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  paragraph: {
    marginBottom: spacing.sm,
    lineHeight: 21,
  },
  bullet: {
    marginBottom: spacing.xs,
    lineHeight: 21,
    paddingHorizontal: spacing.sm,
  },
});
