import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { ContactActionsRow, DetailSection } from '@/src/shared/components/ui';
import type { Renter } from '@/src/shared/types';

interface RenterExtraContactsCardProps {
  contacts: NonNullable<Renter['extra_contacts']>;
}

export function RenterExtraContactsCard({ contacts }: RenterExtraContactsCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <DetailSection title={t('renter.extraContacts')}>
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
    </DetailSection>
  );
}

const styles = StyleSheet.create({
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  contactName: {
    fontWeight: '500',
    flexShrink: 1,
  },
});
