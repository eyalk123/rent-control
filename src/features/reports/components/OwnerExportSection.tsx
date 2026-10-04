import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, SegmentedButtons, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { spacing } from '@/src/core/theme';
import { useAccessibleProperties } from '@/src/features/properties/context/PropertyContext';

/**
 * Every property owner in the portfolio, exactly as typed — `''` is the no-owner group,
 * listed last. Exact rather than normalised because the report groups by the exact string:
 * "Dana Cohen" and "Dana  Cohen" are two owners there, so they are two options here.
 */
export function useReportOwners(): string[] {
  const { properties } = useAccessibleProperties();
  return useMemo(() => {
    const owners = [...new Set(properties.map((p) => p.property_owner || ''))];
    return owners.sort((a, b) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)));
  }, [properties]);
}

/**
 * Reads the `owners` route parameter a history row's Re-export passes: a JSON array of
 * owner names, or absent for every owner.
 */
export function parseOwnersParam(param: string | undefined): string[] | null {
  if (!param) return null;
  try {
    const parsed = JSON.parse(param);
    return Array.isArray(parsed) && parsed.every((o) => typeof o === 'string') ? parsed : null;
  } catch {
    return null;
  }
}

interface Props {
  owners: string[];
  /** `null` means every owner. */
  selected: string[] | null;
  onChange: (selected: string[] | null) => void;
}

/**
 * Which owners go into the export. Renders nothing for a single-owner portfolio, which is
 * most of them. Whether it is one file or a file per owner is asked beside the format —
 * it is a question about the file, not about what the report covers.
 */
export function OwnerExportSection({ owners, selected, onChange }: Props) {
  const { t } = useTranslation();
  if (owners.length < 2) return null;

  // A stale name (an owner renamed since a history row was made) is dropped; a selection
  // left empty by that falls back to everyone rather than an empty report.
  const current = selected?.filter((o) => owners.includes(o)) ?? [];
  const effective = current.length > 0 ? current : owners;
  const isAll = effective.length === owners.length;

  function toggle(owner: string) {
    const has = effective.includes(owner);
    // The last owner cannot be unticked: an empty report is never what anyone meant.
    if (has && effective.length === 1) return;
    const next = new Set(effective);
    if (has) next.delete(owner);
    else next.add(owner);
    const ordered = owners.filter((o) => next.has(o));
    onChange(ordered.length === owners.length ? null : ordered);
  }

  return (
    <View>
      <View style={styles.labelRow}>
        <Text variant="labelLarge">{t('reports.owners')}</Text>
        {!isAll && (
          <Button compact mode="text" onPress={() => onChange(null)}>
            {t('reports.selectAllOwners')}
          </Button>
        )}
      </View>
      <Text variant="bodySmall" style={styles.hint}>
        {t('reports.ownersHint')}
      </Text>
      <View style={styles.chips}>
        {owners.map((owner) => (
          <Chip
            key={owner}
            selected={effective.includes(owner)}
            showSelectedCheck
            mode={effective.includes(owner) ? 'flat' : 'outlined'}
            onPress={() => toggle(owner)}
          >
            {owner || t('reports.noOwner')}
          </Chip>
        ))}
      </View>
    </View>
  );
}

/**
 * The export options for a selection made with this section, and how many owners it
 * covers — a file per owner is only offered for two or more.
 */
export function ownerExportOptions(owners: string[], selected: string[] | null, split: boolean) {
  const current = selected?.filter((o) => owners.includes(o)) ?? [];
  const isAll = current.length === 0 || current.length === owners.length;
  const count = isAll ? owners.length : current.length;
  return { owners: isAll ? null : current, split: split && count > 1, count };
}

/** One grouped file or a ZIP with a file per owner; shown beside the format. */
export function SplitByOwnerSection({ split, onChange }: { split: boolean; onChange: (split: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <View>
      <SegmentedButtons
        value={split ? 'split' : 'one'}
        onValueChange={(v) => onChange(v === 'split')}
        buttons={[
          { value: 'one', label: t('reports.oneFile'), icon: 'file-outline' },
          { value: 'split', label: t('reports.filePerOwner'), icon: 'folder-zip-outline' },
        ]}
        style={styles.segmented}
      />
      {split && (
        <Text variant="bodySmall" style={styles.splitHint}>
          {t('reports.filePerOwnerHint')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    minHeight: 36,
  },
  hint: {
    opacity: 0.7,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  segmented: {
    marginTop: spacing.sm,
  },
  splitHint: {
    opacity: 0.7,
    marginTop: spacing.xs,
  },
});
