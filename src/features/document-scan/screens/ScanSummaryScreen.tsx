import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, ScreenContainer, StepHeader } from '@/src/shared/components/ui';
import { spacing } from '@/src/core/theme';
import { formatMoney } from '@/src/shared/utils/money';
import { peekScanHandoff, setScanHandoff } from '@/src/features/document-scan/handoff';
import type { MappedRenter } from '@/src/features/document-scan/mapExtraction';
import { applyJointRentSplit, equalShares, sharesSumToTotal } from '@/src/features/document-scan/splitJointRent';

const renterName = (r: MappedRenter, i: number, fallback: string): string => {
  const name = `${r.prefill.firstName ?? ''} ${r.prefill.lastName ?? ''}`.trim();
  return name || `${fallback} ${i + 1}`;
};

/** Post-scan summary: shows what the scan found (one property, N renters) before the user
 *  verifies each form. When the lease had a single joint rent, offers an equal/custom split
 *  written into each renter's baseRent on continue. */
export function ScanSummaryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { target } = useLocalSearchParams<{ target?: 'property' | 'renter' }>();

  // Read the handoff once (it isn't consumed until the add screens run).
  const [handoff] = React.useState(() => peekScanHandoff());
  const renters = handoff?.renters ?? [];
  const total = handoff?.jointMonthlyRent ?? 0;
  const showSplit = !!handoff?.rentIsJoint && renters.length > 1 && total > 0;

  const [splitMode, setSplitMode] = React.useState<'equal' | 'custom'>('equal');
  const [customShares, setCustomShares] = React.useState<string[]>(() =>
    equalShares(total, renters.length).map(String),
  );

  const numericCustom = customShares.map((s) => Number(s));
  const customValid =
    numericCustom.every((n) => Number.isFinite(n) && n >= 0) && sharesSumToTotal(numericCustom, total);
  const customSum = numericCustom.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const canContinue = !showSplit || splitMode === 'equal' || customValid;

  const handleContinue = () => {
    if (!handoff || !canContinue) return;
    let finalRenters = renters;
    if (handoff.rentIsJoint && total > 0) {
      const shares = showSplit && splitMode === 'custom' ? numericCustom : equalShares(total, renters.length);
      finalRenters = applyJointRentSplit(renters, total, shares);
    }
    setScanHandoff({ ...handoff, renters: finalRenters });
    router.replace((target === 'property' ? '/properties/add?fromScan=1' : '/renters/add?fromScan=1') as never);
  };

  const address = handoff?.property?.address;
  const city = handoff?.property?.city;
  const shownShares = showSplit && splitMode === 'custom' ? numericCustom : equalShares(total, renters.length);

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
          <View style={[styles.row, { borderColor: theme.colors.outline }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
              {address ? `${address}${city ? `, ${city}` : ''}` : t('documentScan.summaryNoAddress')}
            </Text>
          </View>

          {/* Renters */}
          <View style={styles.sectionHeader}>
            <Icon name="users" size={16} color={theme.colors.primary} />
            <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
              {t('documentScan.summaryRenters', { count: renters.length })}
            </Text>
          </View>
          {renters.map((r, i) => (
            <View key={i} style={[styles.row, styles.rowBetween, { borderColor: theme.colors.outline }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                {renterName(r, i, t('renter.renter'))}
              </Text>
              {handoff?.rentIsJoint && total > 0 && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatMoney(shownShares[i])}
                </Text>
              )}
            </View>
          ))}

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
                  {renters.map((r, i) => (
                    <View key={i} style={styles.rowBetween}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
                        {renterName(r, i, t('renter.renter'))}
                      </Text>
                      <TextInput
                        mode="outlined"
                        dense
                        keyboardType="numeric"
                        style={styles.shareInput}
                        value={customShares[i] ?? ''}
                        onChangeText={(text) =>
                          setCustomShares((prev) => prev.map((v, idx) => (idx === i ? text : v)))
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

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  body: { padding: spacing.formPaddingHorizontal, gap: spacing.sm, paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  row: { borderWidth: 1, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  splitBox: { borderWidth: 1, borderRadius: 12, padding: spacing.md, marginTop: spacing.sm, gap: spacing.xs },
  shareInput: { width: 120 },
  fixedButtonBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 24,
  },
  button: { borderRadius: 12 },
  buttonContent: { minHeight: 48 },
});
