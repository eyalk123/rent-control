import React, { useMemo, useState } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { RadioButton, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguageContext, usePropertyContext, useRenterContext, useRtlLabelStyle } from '@/src/context';
import { MultiSelectField } from '@/src/shared/components/form/MultiSelectField';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

export type ScopeKind = 'all' | 'owners' | 'properties' | 'renters';

export interface ScopeValue {
  scope_property_ids: number[];
  scope_property_owners: string[];
  scope_renter_ids: number[];
}

const EMPTY: ScopeValue = {
  scope_property_ids: [],
  scope_property_owners: [],
  scope_renter_ids: [],
};

function initialKind(v: ScopeValue): ScopeKind {
  if (v.scope_property_owners.length) return 'owners';
  if (v.scope_property_ids.length) return 'properties';
  if (v.scope_renter_ids.length) return 'renters';
  return 'all';
}

interface Props {
  value: ScopeValue;
  onChange: (next: ScopeValue) => void;
}

/** Positive-only scope: pick one dimension, then multi-select within it. Empty
 * across all dimensions means "all properties" (matches the web + backend). */
export function ScopeSelector({ value, onChange }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();
  const { isRtl } = useLanguageContext();
  const [kind, setKind] = useState<ScopeKind>(() => initialKind(value));
  const { properties } = usePropertyContext();
  const { renters } = useRenterContext();

  const ownerOptions = useMemo(
    () =>
      [...new Set(properties.map((p) => p.property_owner).filter((o): o is string => !!o))]
        .sort()
        .map((o) => ({ label: o, value: o })),
    [properties],
  );
  const propertyOptions = useMemo(
    () => properties.map((p) => ({ label: `${p.address}, ${p.city}`, value: p.id })),
    [properties],
  );
  const renterOptions = useMemo(
    () => renters.map((r) => ({ label: `${r.first_name} ${r.last_name}`, value: r.id })),
    [renters],
  );

  const changeKind = (next: ScopeKind) => {
    setKind(next);
    onChange({ ...EMPTY }); // switching dimension clears the previous selection
  };

  return (
    <View style={styles.wrap}>
      <Text variant="bodyMedium" style={[styles.label, rtlLabelStyle, { color: colors.textPrimary }]}>
        {t('notifications.appliesTo')}
      </Text>
      {([
        ['all', 'notifications.scopeAll'],
        ['owners', 'notifications.scopeOwners'],
        ['properties', 'notifications.scopeProperties'],
        ['renters', 'notifications.scopeRenters'],
      ] as const).map(([value, labelKey]) => {
        const selected = kind === value;
        return (
          <Pressable
            key={value}
            onPress={() => changeKind(value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            // Drive direction from the app language so the radio sits on the
            // start side in both LTR and RTL (Paper's own RTL relies on
            // I18nManager, which only flips after a restart here).
            style={[styles.optionRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
          >
            <RadioButton
              value={value}
              status={selected ? 'checked' : 'unchecked'}
              onPress={() => changeKind(value)}
              color={colors.primary}
            />
            <Text style={[styles.radioLabel, rtlLabelStyle, { color: colors.textPrimary }]}>
              {t(labelKey)}
            </Text>
          </Pressable>
        );
      })}

      {kind === 'owners' &&
        (ownerOptions.length > 0 ? (
          <MultiSelectField
            data={ownerOptions}
            value={value.scope_property_owners}
            onChange={(vals) => onChange({ ...EMPTY, scope_property_owners: vals })}
            placeholder={t('notifications.scopeOwners')}
            search
            searchPlaceholder={t('notifications.scopeSearch')}
          />
        ) : (
          <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('notifications.noOwners')}</Text>
        ))}

      {kind === 'properties' && (
        <MultiSelectField
          data={propertyOptions}
          value={value.scope_property_ids}
          onChange={(vals) => onChange({ ...EMPTY, scope_property_ids: vals })}
          placeholder={t('notifications.scopeProperties')}
          search
          searchPlaceholder={t('notifications.scopeSearch')}
        />
      )}

      {kind === 'renters' && (
        <MultiSelectField
          data={renterOptions}
          value={value.scope_renter_ids}
          onChange={(vals) => onChange({ ...EMPTY, scope_renter_ids: vals })}
          placeholder={t('notifications.scopeRenters')}
          search
          searchPlaceholder={t('notifications.scopeSearch')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 6,
    fontWeight: '500',
  },
  optionRow: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  radioLabel: {
    fontSize: 14,
    flexShrink: 1,
  },
  empty: {
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
});
