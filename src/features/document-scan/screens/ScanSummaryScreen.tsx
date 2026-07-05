import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Checkbox, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, ScreenContainer, StepHeader } from '@/src/shared/components/ui';
import { spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import { usePropertyContext, useRenterContext } from '@/src/context';
import { peekScanHandoff, setScanHandoff } from '@/src/features/document-scan/handoff';
import type { MappedRenter } from '@/src/features/document-scan/mapExtraction';
import { applyJointRentSplit, equalShares, sharesSumToTotal } from '@/src/features/document-scan/splitJointRent';
import { findDuplicateRenterIndices, matchProperty } from '@/src/features/document-scan/matchProperty';

const renterName = (r: MappedRenter, i: number, fallback: string): string => {
  const name = `${r.prefill.firstName ?? ''} ${r.prefill.lastName ?? ''}`.trim();
  return name || `${fallback} ${i + 1}`;
};

/** Post-scan summary: shows what the scan found (one property, N renters) before the user
 *  verifies each form. Flags a property/renter that already exists and lets the user exclude
 *  duplicate renters. When the lease had a single joint rent, offers an equal/custom split
 *  written into each kept renter's baseRent on continue. */
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

  // Duplicate detection: does the scanned property match an existing one, and (only then)
  // which scanned renters already exist on it?
  const { propertyMatched, duplicateRenterIdx } = React.useMemo(() => {
    const m = matchProperty(handoff?.property, properties);
    return {
      propertyMatched: m.status === 'matched',
      duplicateRenterIdx: findDuplicateRenterIndices(renters, m.propertyId, existingRenters),
    };
  }, [handoff?.property, properties, renters, existingRenters]);

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

  const toggleExcluded = (i: number) =>
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const handleContinue = () => {
    if (!handoff || !canContinue) return;
    let finalRenters = includedRenters;
    if (handoff.rentIsJoint && total > 0) {
      const shares = showSplit && splitMode === 'custom' ? numericCustom : equalShares(total, includedRenters.length);
      finalRenters = applyJointRentSplit(includedRenters, total, shares);
    }
    setScanHandoff({ ...handoff, renters: finalRenters });
    router.replace((target === 'property' ? '/properties/add?fromScan=1' : '/renters/add?fromScan=1') as never);
  };

  const address = handoff?.property?.address;
  const city = handoff?.property?.city;

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
          <View style={[styles.row, styles.rowBetween, { borderColor: theme.colors.outline }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
              {address ? `${address}${city ? `, ${city}` : ''}` : t('documentScan.summaryNoAddress')}
            </Text>
            {propertyMatched && <DuplicateBadge label={t('documentScan.duplicateProperty')} />}
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
            disabled={!canContinue}
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

/** Small "already exists" pill shown next to a matched property / renter. */
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
