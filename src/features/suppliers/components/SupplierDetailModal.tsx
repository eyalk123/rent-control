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
import { useLanguageContext } from '@/src/context';
import { darkColors, lightColors, spacing } from '@/src/core/theme';
import { ContactActionsRow, Icon } from '@/src/shared/components/ui';
import type { Supplier } from '@/src/shared/types';

interface SupplierDetailModalProps {
  visible: boolean;
  supplier: Supplier | null;
  categoryNames: string;
  onDismiss: () => void;
  onEdit: (id: number) => void;
  onDelete: (supplier: Supplier) => void;
}

export function SupplierDetailModal({
  visible,
  supplier,
  categoryNames,
  onDismiss,
  onEdit,
  onDelete,
}: SupplierDetailModalProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isRtl } = useLanguageContext();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 50) onDismiss();
      },
    }),
  ).current;

  const bankParts = supplier?.bank_account
    ? supplier.bank_account.split('/')
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
      : '';

  const rowDirection = isRtl ? 'row-reverse' : 'row';
  const textAlign = isRtl ? 'right' : 'left';

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
                {supplier?.name}
              </Text>
              {supplier && !supplier.is_active && (
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
            {categoryNames.trim() ? (
              <Text
                style={[styles.categories, { color: colors.textSecondary, textAlign }]}
              >
                {categoryNames}
              </Text>
            ) : null}

            {renderInfoRow(t('suppliers.phone'), supplier?.phone)}
            {renderInfoRow(t('suppliers.email'), supplier?.email)}
            {renderInfoRow(t('suppliers.bankAccount'), bankDisplay)}
            {renderInfoRow(t('suppliers.notes'), supplier?.notes)}

            <ContactActionsRow
              phone={supplier?.phone}
              email={supplier?.email}
              contentAlign={isRtl ? 'flex-end' : 'flex-start'}
              style={styles.contactRow}
            />
          </ScrollView>

          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={() => supplier && onEdit(supplier.id)}
              style={styles.editButton}
              contentStyle={styles.editButtonContent}
            >
              {t('common.edit', { defaultValue: 'Edit' })}
            </Button>
            <Button
              mode="text"
              onPress={() => supplier && onDelete(supplier)}
              textColor={theme.colors.error}
              style={styles.deleteButton}
            >
              {t('suppliers.delete', { defaultValue: 'Delete Supplier' })}
            </Button>
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
});
