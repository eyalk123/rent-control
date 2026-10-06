import React, { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DropdownField, type DropdownItem } from '@/src/shared/components/form';
import { Icon } from '@/src/shared/components/ui';
import { darkColors, lightColors } from '@/src/core/theme';
import type { PropertyOwner } from '@/src/shared/types';

interface PropertyOwnerPickerProps {
  /** Every owner, inactive included (`usePropertyOwnersList`). */
  owners: PropertyOwner[];
  /** False until the list has loaded — until then a stored name cannot be told from an
   *  unknown one. */
  ownersLoaded: boolean;
  /** Refetch them — called when the screen regains focus, e.g. back from adding one. */
  onReload: () => void;
  /** The owner's name: what the field holds, and what the lease scanner fills. */
  value: string;
  onChange: (name: string) => void;
  label: string;
  placeholder?: string;
  /** Shows a "New owner" link under the field, given the unmatched scanned name if any.
   *  The new owner is not preselected — the same as the expense form's "New supplier". */
  onAddOwner?: (initialName: string | null) => void;
  /** RHF field name, set when a scanned lease may have filled this field. */
  reviewName?: string;
}

/**
 * The property's owner, picked from the account's owners. A name the lease scanner read that
 * is not one of them is shown under the field rather than saved as a new owner; "New owner"
 * starts the owner form with it.
 */
export function PropertyOwnerPicker({
  owners,
  ownersLoaded,
  onReload,
  value,
  onChange,
  label,
  placeholder,
  onAddOwner,
  reviewName,
}: PropertyOwnerPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  // Coming back from the add-owner screen: refetch so an owner just saved shows up.
  // The first focus is the mount, which fetches anyway.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) onReload();
      focusedOnce.current = true;
    }, [onReload]),
  );

  const name = value?.trim() ?? '';
  const record = owners.find((o) => o.name === name);
  const readOnLease = ownersLoaded && name && !record ? name : null;

  const data = useMemo<DropdownItem<string | null>[]>(
    () => [
      { label: t('propertyOwners.none'), value: null, pinned: true },
      // Inactive owners stay out of the list, except the one this property already has.
      ...owners
        .filter((o) => o.is_active || o.name === name)
        .map((o) => ({ label: o.name, value: o.name })),
    ],
    [owners, name, t],
  );

  return (
    <View>
      <DropdownField
        data={data}
        value={record ? record.name : null}
        onChange={(v) => onChange(v ?? '')}
        label={label}
        placeholder={placeholder}
        reviewName={reviewName}
      />
      {readOnLease ? (
        <Text variant="bodySmall" style={[styles.readAs, { color: colors.textSecondary }]}>
          {t('propertyOwners.readOnLease', { name: readOnLease })}
        </Text>
      ) : null}
      {onAddOwner && (
        <TouchableOpacity
          style={styles.addLink}
          onPress={() => onAddOwner(readOnLease)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
        >
          <Icon name="plus" size={16} color={colors.primary} />
          <Text variant="labelLarge" style={{ color: colors.primary }}>
            {t('propertyOwners.new')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  readAs: {
    marginTop: -8,
  },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingTop: 6,
    // Clear of the next field's label, which otherwise sits right under it.
    marginBottom: 12,
  },
});
