import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View, StyleSheet } from 'react-native';
import { RadioButton, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useLanguageContext, usePropertyContext, useRenterContext, useRtlLabelStyle } from '@/src/context';
import { Icon } from '@/src/shared/components/ui/Icon';
import { darkColors, lightColors, spacing } from '@/src/core/theme';

export type ScopeKind = 'all' | 'owners' | 'properties' | 'renters';

export interface ScopeValue {
  scope_property_ids: number[];
  scope_property_owners: string[];
  scope_renter_ids: number[];
}

interface Option<T extends string | number> {
  label: string;
  value: T;
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

function toggle<T extends string | number>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

/** Inline search + checkbox list. Renders options in-flow so the form grows and
 * the keyboard-aware scroll keeps the search box visible (no overlay/modal). */
function Checklist<T extends string | number>({
  options,
  selected,
  onToggle,
  emptyText,
}: {
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  emptyText: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();
  const { isRtl } = useLanguageContext();
  const [query, setQuery] = useState('');

  if (options.length === 0) {
    return <Text style={[styles.empty, { color: colors.textSecondary }]}>{emptyText}</Text>;
  }

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('notifications.scopeSearch')}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.search,
          {
            backgroundColor: colors.inputFilledBackground,
            borderColor: colors.outline,
            color: colors.textPrimary,
            textAlign: isRtl ? 'right' : 'left',
          },
        ]}
      />
      {filtered.map((opt) => {
        const checked = selected.includes(opt.value);
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onToggle(opt.value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            style={[styles.checkRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
          >
            <Icon name={checked ? 'check-square' : 'square'} size={20} color={checked ? colors.primary : colors.textSecondary} />
            <Text style={[styles.checkLabel, rtlLabelStyle, { color: colors.textPrimary }]} numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
      {filtered.length === 0 && (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>{t('notifications.scopeNoMatches')}</Text>
      )}
    </View>
  );
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

  const ownerOptions = useMemo<Option<string>[]>(
    () =>
      [...new Set(properties.map((p) => p.property_owner).filter((o): o is string => !!o))]
        .sort()
        .map((o) => ({ label: o, value: o })),
    [properties],
  );
  const propertyOptions = useMemo<Option<number>[]>(
    () => properties.map((p) => ({ label: `${p.address}, ${p.city}`, value: p.id })),
    [properties],
  );
  const renterOptions = useMemo<Option<number>[]>(
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
      ] as const).map(([optionValue, labelKey]) => {
        const selected = kind === optionValue;
        return (
          <Pressable
            key={optionValue}
            onPress={() => changeKind(optionValue)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            // Drive direction from the app language so the radio sits on the
            // start side in both LTR and RTL (Paper's own RTL relies on
            // I18nManager, which only flips after a restart here).
            style={[styles.optionRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}
          >
            <RadioButton
              value={optionValue}
              status={selected ? 'checked' : 'unchecked'}
              onPress={() => changeKind(optionValue)}
              color={colors.primary}
            />
            <Text style={[styles.radioLabel, rtlLabelStyle, { color: colors.textPrimary }]}>{t(labelKey)}</Text>
          </Pressable>
        );
      })}

      {kind === 'owners' && (
        <Checklist
          key="owners"
          options={ownerOptions}
          selected={value.scope_property_owners}
          onToggle={(v) => onChange({ ...EMPTY, scope_property_owners: toggle(value.scope_property_owners, v) })}
          emptyText={t('notifications.noOwners')}
        />
      )}
      {kind === 'properties' && (
        <Checklist
          key="properties"
          options={propertyOptions}
          selected={value.scope_property_ids}
          onToggle={(v) => onChange({ ...EMPTY, scope_property_ids: toggle(value.scope_property_ids, v) })}
          emptyText={t('notifications.scopeNoMatches')}
        />
      )}
      {kind === 'renters' && (
        <Checklist
          key="renters"
          options={renterOptions}
          selected={value.scope_renter_ids}
          onToggle={(v) => onChange({ ...EMPTY, scope_renter_ids: toggle(value.scope_renter_ids, v) })}
          emptyText={t('notifications.scopeNoMatches')}
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
  search: {
    height: 44,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    fontSize: 14,
    marginTop: 4,
    marginBottom: spacing.xs,
  },
  checkRow: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
  },
  checkLabel: {
    fontSize: 14,
    flexShrink: 1,
  },
  empty: {
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
});
