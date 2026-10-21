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
import { darkColors, lightColors, spacing, useEntityColor } from '@/src/core/theme';
import { ContactActionsRow, Icon, InitialsTile } from '@/src/shared/components/ui';
import type { ExpenseCategory, Supplier } from '@/src/shared/types';
import { CategoryTag } from '@/src/features/transactions/components/shared/CategoryTag';
import { getCategoryDisplayName } from '@/src/features/transactions/utils/categoryUtils';
import { supplierColorKey } from '@/src/features/suppliers/utils/supplierColor';

interface SupplierDetailModalProps {
  visible: boolean;
  supplier: Supplier | null;
  /** Every expense category: the supplier's own are picked out, and give it its color. */
  categories: ExpenseCategory[];
  onDismiss: () => void;
  onEdit: (id: number) => void;
  onDelete: (supplier: Supplier) => void;
}

export function SupplierDetailModal({
  visible,
  supplier,
  categories,
  onDismiss,
  onEdit,
  onDelete,
}: SupplierDetailModalProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const itemColor = useEntityColor(supplier ? supplierColorKey(supplier, categories) : null);
  const supplierCategories = (supplier?.category_ids ?? [])
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is ExpenseCategory => !!c);

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

  // No isRtl flipping here: the app forces native RTL, under which "row" and "left" already
  // mean "start". Reversing them again on top of that rendered the whole sheet LTR in Hebrew.
  const rowDirection = 'row';
  const textAlign = 'left';

  // Label at the start, value at the end, hairlines between: the detail screens' rows.
  const infoRows = [
    { label: t('suppliers.phone'), value: supplier?.phone },
    { label: t('suppliers.email'), value: supplier?.email },
    { label: t('suppliers.bankAccount'), value: bankDisplay },
    { label: t('suppliers.notes'), value: supplier?.notes },
  ].filter((r): r is { label: string; value: string } => !!r.value && !!r.value.trim());

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
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + spacing.lg,
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.outline }]} />
          </View>

          <View style={[styles.header, { flexDirection: rowDirection }]}>
            <InitialsTile
              name={supplier?.name ?? ''}
              size={60}
              radius={18}
              backgroundColor={itemColor.bg}
              textColor={itemColor.fg}
            />
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
              {supplierCategories.length > 0 ? (
                <View style={styles.tags}>
                  {supplierCategories.map((cat) => (
                    <CategoryTag key={cat.id} label={getCategoryDisplayName(cat, t)} color={cat.color} />
                  ))}
                </View>
              ) : null}
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
            <ContactActionsRow
              phone={supplier?.phone}
              email={supplier?.email}
              raised
              style={styles.contactRow}
            />

            {infoRows.length > 0 ? (
              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}>
                {infoRows.map((row, i) => (
                  <View
                    key={row.label}
                    style={[
                      styles.infoRow,
                      i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.outline },
                    ]}
                  >
                    <Text style={[styles.infoLabel, { color: colors.textSecondary, textAlign }]}>{row.label}</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={3}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.xs,
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
  infoCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 15,
    flexShrink: 1,
    textAlign: 'right',
  },
  contactRow: {
    marginBottom: spacing.lg,
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
