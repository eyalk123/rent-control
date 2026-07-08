import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Checkbox, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, ScreenContainer, StepHeader } from '@/src/shared/components/ui';
import { DropdownField } from '@/src/shared/components/form';
import { spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import { usePropertyContext, useRenterContext } from '@/src/context';
import { formatFloorApartment } from '@/src/shared/utils/propertyAddress';
import { peekScanHandoff, setScanHandoff } from '@/src/features/document-scan/handoff';
import type { MappedRenter } from '@/src/features/document-scan/mapExtraction';
import type { PropertyMatchStatus } from '@/src/features/document-scan/matchProperty';
import { applyJointRentSplit, equalShares, sharesSumToTotal } from '@/src/features/document-scan/splitJointRent';
import { findDuplicateRenterMatches, matchProperty } from '@/src/features/document-scan/matchProperty';

const renterName = (r: MappedRenter, i: number, fallback: string): string => {
  const name = `${r.prefill.firstName ?? ''} ${r.prefill.lastName ?? ''}`.trim();
  return name || `${fallback} ${i + 1}`;
};

/** Post-scan summary: shows what the scan found (one property, N renters) before the user
 *  verifies each form. Lets the user edit the found address, attach the lease to an existing
 *  property (resolving any field conflicts) or create a new one, and exclude duplicate renters.
 *  When the lease had a single joint rent, offers an equal/custom split written into each kept
 *  renter's baseRent on continue. */
export function ScanSummaryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { target } = useLocalSearchParams<{ target?: 'property' | 'renter' }>();
  const { properties } = usePropertyContext();
  const { renters: existingRenters } = useRenterContext();

  // Read the handoff once (it isn't consumed until the add screens run).
  const [handoff] = React.useState(() => peekScanHandoff());
  const renters = React.useMemo(() => handoff?.renters ?? [], [handoff]);
  const total = handoff?.jointMonthlyRent ?? 0;

  // Editable address/city (seeded from the scan). Editing them re-runs the auto match.
  const [editedAddress, setEditedAddress] = React.useState(() => handoff?.property?.address ?? '');
  const [editedCity, setEditedCity] = React.useState(() => handoff?.property?.city ?? '');

  // Which existing property (if any) to attach the lease to. `null` = create a new property.
  // Auto-matched from the address, until the user explicitly picks in the dropdown.
  const autoMatchId = React.useMemo(
    () =>
      matchProperty(
        {
          address: editedAddress,
          city: editedCity,
          floor: handoff?.property?.floor,
          apartment: handoff?.property?.apartment,
        },
        properties,
      ).propertyId,
    [editedAddress, editedCity, handoff?.property?.floor, handoff?.property?.apartment, properties],
  );
  const [targetPropertyId, setTargetPropertyId] = React.useState<number | null>(autoMatchId);
  const [userPicked, setUserPicked] = React.useState(false);
  React.useEffect(() => {
    if (!userPicked) setTargetPropertyId(autoMatchId);
  }, [autoMatchId, userPicked]);

  const propertyData = React.useMemo(
    () => [
      { label: t('documentScan.createNewProperty'), value: null as number | null },
      ...properties.map((p) => ({
        label: `${p.address}${formatFloorApartment(p, t)} - ${p.city}`,
        value: p.id as number,
      })),
    ],
    [properties, t],
  );

  // Duplicate detection keyed off the chosen property: scanned index -> matched existing renter
  // id. They get a badge + include/exclude checkbox, and when kept the form edits that renter.
  const duplicateRenterIdx = React.useMemo(
    () => findDuplicateRenterMatches(renters, targetPropertyId, existingRenters),
    [renters, targetPropertyId, existingRenters],
  );

  // Duplicate renters the user unchecked (excluded from creation). Keyed by original index.
  const [excluded, setExcluded] = React.useState<Set<number>>(() => new Set());
  const includedIdx = React.useMemo(
    () => renters.map((_, i) => i).filter((i) => !excluded.has(i)),
    [renters, excluded],
  );
  const includedRenters = React.useMemo(() => includedIdx.map((i) => renters[i]), [includedIdx, renters]);
  const posByIdx = React.useMemo(
    () => new Map(includedIdx.map((idx, pos) => [idx, pos])),
    [includedIdx],
  );

  const showSplit = !!handoff?.rentIsJoint && includedRenters.length > 1 && total > 0;

  const [splitMode, setSplitMode] = React.useState<'equal' | 'custom'>('equal');
  const [customShares, setCustomShares] = React.useState<string[]>(() =>
    equalShares(total, includedRenters.length).map(String),
  );
  // Excluding/including a renter changes the split; reset custom shares to an even split.
  React.useEffect(() => {
    setCustomShares(equalShares(total, includedRenters.length).map(String));
  }, [includedRenters.length, total]);

  const numericCustom = customShares.map((s) => Number(s));
  const customValid =
    numericCustom.every((n) => Number.isFinite(n) && n >= 0) && sharesSumToTotal(numericCustom, total);
  const customSum = numericCustom.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const splitValid = !showSplit || splitMode === 'equal' || customValid;
  const canContinue = includedRenters.length > 0 && splitValid;

  const [submitting, setSubmitting] = React.useState(false);

  const toggleExcluded = (i: number) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const onPickProperty = (id: number | null) => {
    setUserPicked(true);
    setTargetPropertyId(id);
  };

  const handleContinue = () => {
    if (!handoff || !canContinue || submitting) return;
    setSubmitting(true);

    // Tag each kept renter with the existing renter it duplicates (if any) so the form edits that
    // renter in place instead of creating a copy.
    const taggedRenters = includedIdx.map((origIdx, pos) => ({
      ...includedRenters[pos],
      existingRenterId: duplicateRenterIdx.get(origIdx) ?? null,
    }));

    let finalRenters: MappedRenter[] = taggedRenters;
    if (handoff.rentIsJoint && total > 0) {
      const shares = showSplit && splitMode === 'custom' ? numericCustom : equalShares(total, taggedRenters.length);
      finalRenters = applyJointRentSplit(taggedRenters, total, shares);
    }

    const editedProperty = { ...handoff.property, address: editedAddress, city: editedCity };
    const matchStatus: PropertyMatchStatus = targetPropertyId != null ? 'matched' : 'none';
    setScanHandoff({
      ...handoff,
      property: editedProperty,
      renters: finalRenters,
      matchedPropertyId: targetPropertyId,
      propertyMatchStatus: matchStatus,
    });

    if (target === 'property') {
      // The property is reviewed in its own form, which now always opens — in edit mode when the
      // lease matched an existing property, create mode otherwise. It then chains into the renters.
      router.replace(
        (targetPropertyId != null
          ? `/properties/edit/${targetPropertyId}?fromScan=1`
          : '/properties/add?fromScan=1') as never,
      );
    } else {
      // Renter-target scan: go straight to the renter form on the chosen property.
      router.replace('/renters/add?fromScan=1' as never);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.body}>
          <StepHeader
            title={t('documentScan.summaryTitle')}
            currentStep={1}
            totalSteps={1}
            onBack={() => router.back()}
          />
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t('documentScan.summarySubtitle')}
          </Text>

          {/* Property */}
          <View style={styles.sectionHeader}>
            <Icon name="home" size={16} color={theme.colors.primary} />
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              {t('documentScan.summaryProperty', { count: 1 })}
            </Text>
          </View>

          <TextInput
            mode="outlined"
            dense
            label={t('property.address')}
            value={editedAddress}
            onChangeText={setEditedAddress}
          />
          <TextInput
            mode="outlined"
            dense
            label={t('property.city')}
            value={editedCity}
            onChangeText={setEditedCity}
            style={{ marginTop: spacing.xs }}
          />

          <View style={{ marginTop: spacing.sm }}>
            <DropdownField
              data={propertyData}
              value={targetPropertyId}
              onChange={onPickProperty}
              label={t('documentScan.attachToProperty')}
            />
          </View>

          {/* Renters */}
          <View style={styles.sectionHeader}>
            <Icon name="users" size={16} color={theme.colors.primary} />
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              {t('documentScan.summaryRenters', { count: renters.length })}
            </Text>
          </View>
          {renters.map((r, i) => {
            const isDuplicate = duplicateRenterIdx.has(i);
            const isExcluded = excluded.has(i);
            const pos = posByIdx.get(i);
            return (
              <View
                key={i}
                style={[styles.row, styles.rowBetween, { borderColor: theme.colors.outline, opacity: isExcluded ? 0.55 : 1 }]}
              >
                <View style={styles.rowLeft}>
                  {isDuplicate && (
                    <Checkbox
                      status={isExcluded ? 'unchecked' : 'checked'}
                      onPress={() => toggleExcluded(i)}
                    />
                  )}
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flexShrink: 1 }}>
                    {renterName(r, i, t('renter.renter'))}
                  </Text>
                  {isDuplicate && <DuplicateBadge label={t('documentScan.duplicateRenter')} />}
                </View>
                {handoff?.rentIsJoint && total > 0 && !isExcluded && pos !== undefined && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatMoney(
                      splitMode === 'custom' ? numericCustom[pos] : equalShares(total, includedRenters.length)[pos],
                    )}
                  </Text>
                )}
              </View>
            );
          })}

          {/* Joint rent split */}
          {showSplit && (
            <View style={[styles.splitBox, { borderColor: theme.colors.outline }]}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                {t('documentScan.jointRentTitle')}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.sm }}>
                {t('documentScan.jointRentHint', { amount: formatMoney(total) })}
              </Text>
              <SegmentedButtons
                value={splitMode}
                onValueChange={(v) => setSplitMode(v as 'equal' | 'custom')}
                buttons={[
                  { value: 'equal', label: t('documentScan.splitEqual') },
                  { value: 'custom', label: t('documentScan.splitCustom') },
                ]}
              />
              {splitMode === 'custom' && (
                <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                  {includedRenters.map((r, pos) => (
                    <View key={includedIdx[pos]} style={styles.rowBetween}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
                        {renterName(r, includedIdx[pos], t('renter.renter'))}
                      </Text>
                      <TextInput
                        mode="outlined"
                        dense
                        keyboardType="numeric"
                        style={styles.shareInput}
                        value={customShares[pos] ?? ''}
                        onChangeText={(text) =>
                          setCustomShares((prev) => prev.map((v, idx) => (idx === pos ? text : v)))
                        }
                      />
                    </View>
                  ))}
                  <Text
                    variant="bodySmall"
                    style={{ color: customValid ? theme.colors.onSurfaceVariant : theme.colors.error }}
                  >
                    {t('documentScan.splitSum', { sum: formatMoney(customSum), total: formatMoney(total) })}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.fixedButtonBar}>
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={!canContinue || submitting}
            loading={submitting}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {t('common.continue')}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

/** Small "already exists" pill shown next to a matched renter. */
function DuplicateBadge({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.errorContainer }]}>
      <Text variant="labelSmall" style={{ color: theme.colors.onErrorContainer }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  body: { padding: spacing.formPaddingHorizontal, gap: spacing.sm, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  row: { borderWidth: 1, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1, flex: 1 },
  splitBox: { borderWidth: 1, borderRadius: 12, padding: spacing.md, marginTop: spacing.sm, gap: spacing.xs },
  shareInput: { width: 120 },
  badge: { borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  fixedButtonBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 24,
  },
  button: { borderRadius: 12 },
  buttonContent: { minHeight: 48 },
});
