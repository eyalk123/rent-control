import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { ContactActionsRow } from '@/src/shared/components/ui';
import type { Renter } from '@/src/shared/types';

interface RenterExtraContactsCardProps {
  contacts: NonNullable<Renter['extra_contacts']>;
}

export function RenterExtraContactsCard({ contacts }: RenterExtraContactsCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <Card style={styles.card} mode="outlined">
      <View style={[styles.sectionHeader, { backgroundColor: colors.secondary }]}>
        <Text variant="titleSmall" style={[styles.sectionHeaderText, { color: colors.onPrimary }]}>
          {t('renter.extraContacts')}
        </Text>
      </View>
      <Card.Content style={styles.cardContent}>
        {contacts.map((contact, idx) => (
          <View key={idx} style={styles.contactRow}>
            <Text variant="bodyMedium" style={[styles.contactName, { color: colors.textPrimary }]}>
              {contact.name}
            </Text>
            <ContactActionsRow
              phone={contact.phone}
              variant="compact"
              contentAlign="flex-end"
            />
          </View>
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  contactName: {
    fontWeight: '500',
    flexShrink: 1,
    marginEnd: spacing.sm,
  },
});
