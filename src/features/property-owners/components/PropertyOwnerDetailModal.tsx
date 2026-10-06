import React, { useRef } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { ContactActionsRow, Icon } from '@/src/shared/components/ui';
import { capabilities } from '@/src/shared/utils/capabilities';
import { propertyCountLabel } from '@/src/features/property-owners/api/propertyOwners';
import type { PropertyOwner } from '@/src/shared/types';

interface PropertyOwnerDetailModalProps {
  visible: boolean;
  owner: PropertyOwner | null;
  onDismiss: () => void;
  onEdit: (id: number) => void;
  onDelete: (owner: PropertyOwner) => void;
}

/** The owner detail sheet, for an owner: the property count in place of the categories,
 *  and delete offered only once no property is left on them. */
export function PropertyOwnerDetailModal({
  visible,
  owner,
  onDismiss,
  onEdit,
  onDelete,
}: PropertyOwnerDetailModalProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50) onDismiss();
      },
    }),
  ).current;

  // Split into bank/branch/account only where it was stored that way; elsewhere it is the
  // free text that was typed.
  const structured = capabilities().structuredBankDetails;
  const bankParts = structured && owner?.bank_account
    ? owner.bank_account.split('/')
    : [];
  const bankDisplay =
    bankParts.length > 0
      ? [
          bankParts[0] && `${t('suppliers.bankCode')} ${bankParts[0]}`,
          bankParts[1] && `${t('suppliers.branchCode')} ${bankParts[1]}`,
          bankParts[2] && `${t('suppliers.accountNumber')} ${bankParts[2]}`,
        ]
          .filter(Boolean)
          .join(' · ')
      : (owner?.bank_account ?? '');

  // No isRtl flipping here: the app forces native RTL, under which "row" and "left" already
  // mean "start". Reversing them again on top of that rendered the whole sheet LTR in Hebrew.
  const rowDirection = 'row';
  const textAlign = 'left';

  const renderInfoRow = (label: string, value?: string | null) => {
    if (!value || !value.trim()) return null;
    return (
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary, textAlign }]}>
          {label}
        </Text>
        <Text style={[styles.infoValue, { color: colors.textPrimary, textAlign }]}>
          {value}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onDismiss} />

      <View style={styles.container} pointerEvents="box-none">
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.inputFilledBackground,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.outline }]} />
          </View>

          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <View style={styles.titleWrapper}>
              <Text
                variant="titleLarge"
                style={[styles.title, { color: colors.textPrimary, textAlign }]}
                numberOfLines={2}
              >
                {owner?.name}
              </Text>
              {owner && !owner.is_active && (
                <Text
                  variant="bodySmall"
                  style={[styles.inactiveBadge, { color: theme.colors.error, textAlign }]}
                >
                  {t('suppliers.inactive', { defaultValue: 'Inactive' })}
                </Text>
              )}
            </View>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <Icon name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyContent}
          >
            {owner ? (
              <Text
                style={[styles.categories, { color: colors.textSecondary, textAlign }]}
              >
                {propertyCountLabel(t, owner.property_count)}
              </Text>
            ) : null}

            {renderInfoRow(t('suppliers.phone'), owner?.phone)}
            {renderInfoRow(t('suppliers.email'), owner?.email)}
            {renderInfoRow(t(structured ? 'suppliers.bankAccount' : 'suppliers.paymentDetails'), bankDisplay)}
            {renderInfoRow(t('suppliers.notes'), owner?.notes)}

            <ContactActionsRow
              phone={owner?.phone}
              email={owner?.email}
              contentAlign="flex-start"
              style={styles.contactRow}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={() => owner && onEdit(owner.id)}
              style={styles.editButton}
              contentStyle={styles.editButtonContent}
            >
              {t('common.edit', { defaultValue: 'Edit' })}
            </Button>
            {owner && owner.property_count === 0 ? (
              <Button
                mode="text"
                onPress={() => onDelete(owner)}
                textColor={theme.colors.error}
                style={styles.deleteButton}
              >
                {t('propertyOwners.delete')}
              </Button>
            ) : (
              <Text
                variant="bodySmall"
                style={[styles.deleteBlocked, { color: colors.textSecondary }]}
              >
                {t('propertyOwners.deleteBlocked')}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: '700',
  },
  inactiveBadge: {
    marginTop: 2,
  },
  body: {
    maxHeight: 360,
  },
  bodyContent: {
    paddingBottom: spacing.sm,
  },
  categories: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  infoRow: {
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
  },
  contactRow: {
    marginTop: spacing.xs,
  },
  footer: {
    paddingTop: spacing.sm,
  },
  editButton: {
    borderRadius: 12,
  },
  editButtonContent: {
    minHeight: 48,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  deleteBlocked: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
