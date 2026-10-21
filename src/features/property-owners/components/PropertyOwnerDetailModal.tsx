import React, { useRef } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { darkColors, lightColors, spacing, ICON_SM } from '@/src/core/theme';
import { ColorDot, ContactActionsRow, Icon, InitialsTile } from '@/src/shared/components/ui';
import { useRouter } from 'expo-router';
import { useLanguageContext, usePropertyContext } from '@/src/context';
import { PropertyThumb } from '@/src/features/properties/components/PropertyThumb';
import { propertyTypeLabelKey } from '@/src/features/properties/constants/propertyTypeLabel';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
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
  const router = useRouter();
  const { isRtl } = useLanguageContext();
  const { properties } = usePropertyContext();
  const ownerProperties = owner ? properties.filter((p) => p.property_owner_id === owner.id) : [];

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

  // Label at the start, value at the end, hairlines between: the detail screens' rows.
  const infoRows = [
    { label: t('suppliers.phone'), value: owner?.phone },
    { label: t('suppliers.email'), value: owner?.email },
    { label: t(structured ? 'suppliers.bankAccount' : 'suppliers.paymentDetails'), value: bankDisplay },
    { label: t('suppliers.notes'), value: owner?.notes },
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
              name={owner?.name ?? ''}
              size={60}
              radius={18}
              backgroundColor={colors.primaryBg}
              textColor={colors.primary}
            />
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
              {owner ? (
                <Text style={[styles.count, { color: colors.textSecondary, textAlign }]}>
                  {propertyCountLabel(t, owner.property_count)}
                </Text>
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
              phone={owner?.phone}
              email={owner?.email}
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

            {/* The owner's properties, each opening its own screen: what an owner is, in this app. */}
            {ownerProperties.length > 0 ? (
              <View style={styles.properties}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary, textAlign }]}>
                  {t('home.properties')}
                </Text>
                {ownerProperties.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      onDismiss();
                      router.push(`/properties/${p.id}` as any);
                    }}
                    accessibilityRole="button"
                    style={[styles.propertyCard, { backgroundColor: colors.surface, borderColor: colors.outline }]}
                  >
                    <PropertyThumb property={p} width={56} height={42} />
                    <View style={styles.propertyText}>
                      <View style={styles.propertyTitleRow}>
                        <ColorDot color={p.color} />
                        <Text numberOfLines={1} style={[styles.propertyTitle, { color: colors.textPrimary }]}>
                          {p.address}{formatFloorApartment(p, t)}
                        </Text>
                      </View>
                      <Text numberOfLines={1} style={[styles.propertySub, { color: colors.textSecondary, textAlign }]}>
                        {`${p.city} · ${t(propertyTypeLabelKey(p.type))}`}
                      </Text>
                    </View>
                    <Icon name={isRtl ? 'chevron-left' : 'chevron-right'} size={ICON_SM} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  count: {
    fontSize: 14,
    marginTop: 2,
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
    maxHeight: 420,
  },
  bodyContent: {
    paddingBottom: spacing.sm,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
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
  properties: {
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  propertyText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  propertyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  propertySub: {
    fontSize: 12,
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
