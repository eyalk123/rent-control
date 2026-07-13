import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import {
  LoadingOverlay,
  ScreenContainer,
  StepHeader,
  Stepper,
  SegmentedControl,
  Icon,
  type Segment,
} from "@/src/shared/components/ui";
import { FormScrollView, EscalationValueField, LeaseYearAmountField, LeaseYearTypeText } from "@/src/shared/components/form";
import { darkColors, lightColors, spacing, ICON_SM } from "@/src/core/theme";
import { useLanguageContext, useAlert } from "@/src/core/context";
import { useRenterContext } from "@/src/context";
import { getRenterById, updateRenter } from "@/src/features/renters/api/renters";
import { getApiErrorMessage } from "@/src/core/api/client";
import { buildAddedYears, hasContractAfterOptionYear, reconstructIntentFromLeaseYears } from "@/src/shared/utils/leaseSchedule";
import { getLeaseEndDate, type LeaseYear, type LeaseYearType, type RentEscalationMode, type Renter } from "@/src/shared/types";
import { getLeaseYearLabel, isCurrentLeaseYear } from "@/src/shared/utils/leaseYear";
import { formatMoney } from "@/src/shared/utils/money";
import { formatDateFull } from "@/src/shared/utils/dates";

type Row = { amount: string; type: LeaseYearType };

// Increment applied to *new* years. "custom" is intentionally omitted: existing rows are
// individually editable, and added rows follow the increment.
const INCREMENT_MODES: RentEscalationMode[] = ["none", "percent", "fixed"];

/**
 * Focused lease-extension screen. Shows the current lease, grows it via a single "years to
 * add" number input (auto-priced from the lease's existing escalation) and lets the owner
 * edit/delete/convert the existing years, then saves the whole schedule via PATCH — no full
 * renter edit needed. Reached from the renter detail header and the "Update lease"
 * expiring-lease notification.
 */
export function ExtendLeaseScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { appAlert } = useAlert();
  const { refreshRenters } = useRenterContext();
  const { isRtl, language } = useLanguageContext();

  const [renter, setRenter] = React.useState<Renter | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [existingRows, setExistingRows] = React.useState<Row[]>([]);
  const [mode, setMode] = React.useState<RentEscalationMode>("none");
  const [value, setValue] = React.useState("");
  const [addCount, setAddCount] = React.useState(0);
  const [addOptionCount, setAddOptionCount] = React.useState(0);

  const initialSnapshot = React.useRef("");
  const savedRef = React.useRef(false);

  // Load the renter and seed local state. Prefer the persisted escalation rule; fall back to
  // what the saved schedule implies.
  React.useEffect(() => {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getRenterById(numericId)
      .then((data) => {
        setRenter(data);
        const seededRows: Row[] = (data.lease_years ?? []).map((y) => ({
          amount: String(y.amount),
          type: y.type,
        }));
        const seededMode: RentEscalationMode =
          data.rent_escalation_mode ?? reconstructIntentFromLeaseYears(data.lease_years).escalationMode;
        const editorMode: RentEscalationMode = seededMode === "custom" ? "none" : seededMode;
        const seededValue = data.rent_escalation_value != null ? String(data.rent_escalation_value) : "";
        setExistingRows(seededRows);
        setMode(editorMode);
        setValue(seededValue);
        setAddCount(0);
        setAddOptionCount(0);
        initialSnapshot.current = JSON.stringify({ rows: seededRows, mode: editorMode, value: seededValue, addCount: 0, addOptionCount: 0 });
      })
      .catch((err) => appAlert(t("error.title"), getApiErrorMessage(err, t("error.loadFailed"))))
      .finally(() => setLoading(false));
  }, [id]);

  const existingYears: LeaseYear[] = React.useMemo(
    () => existingRows.map((r) => ({ amount: Number(r.amount) || 0, type: r.type })),
    [existingRows],
  );

  // New years grow/shrink reactively with the number inputs — no explicit "add" action.
  const addedYears: LeaseYear[] = React.useMemo(
    () => buildAddedYears(existingYears, addCount, addOptionCount, mode, Number(value) || 0),
    [existingYears, addCount, addOptionCount, mode, value],
  );

  const allYears: LeaseYear[] = React.useMemo(() => [...existingYears, ...addedYears], [existingYears, addedYears]);

  const orderInvalid = React.useMemo(() => hasContractAfterOptionYear(allYears), [allYears]);

  const dirty =
    JSON.stringify({ rows: existingRows, mode, value, addCount, addOptionCount }) !== initialSnapshot.current;

  // Discard-changes guard on back navigation (mirrors AddEditRenterScreen).
  React.useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!dirty || savedRef.current) return;
      e.preventDefault();
      appAlert(t("common.discardChanges"), t("common.discardChangesMessage"), [
        { text: t("common.cancel"), style: "cancel", onPress: () => {} },
        {
          text: t("common.discard"),
          style: "destructive",
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
    return unsub;
  }, [navigation, dirty, t, appAlert]);

  const leaseStart = renter?.lease_start ?? undefined;
  const originalEnd = renter ? getLeaseEndDate(renter) : null;
  const newEnd = React.useMemo(
    () => (renter ? getLeaseEndDate({ ...renter, lease_years: allYears }) : null),
    [renter, allYears],
  );
  const yearDelta = allYears.length - (renter?.lease_years?.length ?? 0);

  const updateAmount = (index: number, amount: string) =>
    setExistingRows((prev) => prev.map((r, i) => (i === index ? { ...r, amount } : r)));

  const removeRow = (index: number) => setExistingRows((prev) => prev.filter((_, i) => i !== index));

  const toggleType = (index: number) => {
    Haptics.selectionAsync();
    setExistingRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, type: r.type === "contract" ? "option" : "contract" } : r)),
    );
  };

  const handleSave = async () => {
    if (!renter || orderInvalid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      await updateRenter(renter.id, {
        lease_years: allYears,
        contract_term_years: allYears.filter((y) => y.type === "contract").length,
        option_years: allYears.filter((y) => y.type === "option").length,
        rent_escalation_mode: mode,
        rent_escalation_value: value ? Number(value) : null,
      });
      await refreshRenters();
      savedRef.current = true;
      router.back();
    } catch (err) {
      appAlert(t("error.title"), getApiErrorMessage(err, t("error.saveRenterFailed")));
    } finally {
      setSaving(false);
    }
  };

  const incrementSegments: Segment<RentEscalationMode>[] = INCREMENT_MODES.map((m) => ({
    value: m,
    label:
      m === "none"
        ? t("renter.rentChangeSame")
        : m === "percent"
        ? t("renter.rentChangePercent")
        : t("renter.rentChangeFixed"),
  }));

  // forceRTL is set but the app never reloads, so native layout isn't actually mirrored:
  // a plain "row" stays visually LTR and an explicit textAlign: "right" gets flipped left by
  // the RTL flag. So we derive direction from `isRtl` (like StepHeader/Stepper) and let text
  // fall back to the default "auto" alignment, which aligns Hebrew to the right correctly.
  const rowDirection = isRtl ? ("row-reverse" as const) : ("row" as const);

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <FormScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <StepHeader
            title={t("renter.extendLeaseTitle")}
            subtitle={renter ? `${renter.first_name} ${renter.last_name}` : undefined}
            currentStep={1}
            totalSteps={1}
            onBack={() => router.back()}
          />

          {/* Add years — the number inputs drive the schedule; no button */}
          <View style={[styles.card, { borderColor: colors.outline, backgroundColor: colors.surface }]}>
            <View style={[styles.stepperRow, { flexDirection: rowDirection, justifyContent: isRtl ? "flex-end" : "flex-start" }]}>
              <Stepper
                label={t("renter.yearsToAdd")}
                unitLabel={t("renter.yearsUnit")}
                min={0}
                max={10}
                value={addCount}
                onChange={setAddCount}
              />
              <Stepper
                label={t("renter.optionYearsToAdd")}
                unitLabel={t("renter.yearsUnit")}
                min={0}
                max={10}
                value={addOptionCount}
                onChange={setAddOptionCount}
              />
            </View>

            {/* Increment for new years */}
            <View style={styles.incrementBlock}>
              {mode === "cpi" ? (
                // CPI-linked lease: linkage is preserved and priced server-side; no
                // manual increment choice here.
                <>
                  <Text style={[styles.escCaption, { color: colors.textPrimary, fontWeight: "600", marginBottom: spacing.xs }]}>
                    {t("renter.newYearIncrement")}
                  </Text>
                  <Text style={[styles.cpiNote, { color: colors.textSecondary }]}>
                    {t("renter.rentChangeCpiNote")}
                  </Text>
                </>
              ) : (
                <SegmentedControl
                  label={t("renter.newYearIncrement")}
                  segments={incrementSegments}
                  value={mode}
                  onChange={setMode}
                />
              )}
              {(mode === "percent" || mode === "fixed") && (
                <EscalationValueField mode={mode} value={value} onChangeText={setValue} />
              )}
            </View>
          </View>

          {/* New lease schedule = live preview */}
          <Text variant="bodyMedium" style={[styles.scheduleTitle, { color: colors.textPrimary }]}>
            {t("renter.newLeaseSchedule")}
          </Text>
          {orderInvalid && (
            <View style={[styles.warning, { flexDirection: rowDirection, borderColor: colors.warning, backgroundColor: colors.inputFilledBackground }]}>
              <Icon name="alert-circle" size={ICON_SM} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>{t("renter.leaseOrderWarning")}</Text>
            </View>
          )}
          {allYears.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("renter.noLeaseYears")}</Text>
          ) : (
            <>
              {/* Existing years — editable amount, deletable, type convertible */}
              {existingRows.map((row, index) => {
                const isCurrent = isCurrentLeaseYear(leaseStart, index);
                return (
                  <View
                    key={`existing-${index}`}
                    style={[
                      styles.yearRow,
                      { flexDirection: rowDirection },
                      isCurrent && { backgroundColor: colors.accent + "14", borderRadius: 8 },
                    ]}
                  >
                    <Text
                      style={[styles.yearLabel, { color: colors.textPrimary }, isCurrent && styles.yearLabelCurrent]}
                    >
                      {getLeaseYearLabel(leaseStart, index)}
                    </Text>
                    <LeaseYearAmountField value={row.amount} onChangeText={(v) => updateAmount(index, v)} />
                    <Pressable
                      onPress={() => toggleType(index)}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={t("renter.tapToChangeType")}
                      style={styles.typeToggle}
                    >
                      <LeaseYearTypeText type={row.type} style={styles.typeText} />
                    </Pressable>
                    <Pressable
                      onPress={() => removeRow(index)}
                      hitSlop={8}
                      accessibilityLabel={t("renter.removeYear")}
                      style={styles.deleteButton}
                    >
                      <Icon name="trash" size={ICON_SM} color={colors.error} />
                    </Pressable>
                  </View>
                );
              })}
              {/* Added years — auto-priced, read-only (adjust via the number inputs + increment) */}
              {addedYears.map((year, j) => {
                const index = existingRows.length + j;
                return (
                  <View key={`added-${j}`} style={[styles.yearRow, { flexDirection: rowDirection }]}>
                    <Text style={[styles.yearLabel, { color: colors.textPrimary }]}>
                      {getLeaseYearLabel(leaseStart, index)}
                    </Text>
                    <Text style={[styles.addedAmount, { color: colors.textPrimary }]}>
                      {year.amount > 0 ? formatMoney(year.amount) : "—"}
                    </Text>
                    <LeaseYearTypeText type={year.type} style={styles.typeText} />
                    <View style={[styles.newTag, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.newTagText, { color: colors.onPrimary }]}>{t("renter.newYearTag")}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* Change summary */}
          <View style={[styles.summaryCard, { borderColor: colors.outline, backgroundColor: colors.inputFilledBackground }]}>
            <View style={[styles.summaryRow, { flexDirection: rowDirection }]}>
              <Icon name="calendar-clock" size={ICON_SM} color={colors.textSecondary} />
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {originalEnd ? formatDateFull(originalEnd, language) : "—"}
                {isRtl ? "  ←  " : "  →  "}
                <Text style={{ color: colors.textPrimary, fontWeight: "700" }}>
                  {newEnd ? formatDateFull(newEnd, language) : "—"}
                </Text>
              </Text>
            </View>
            {yearDelta !== 0 && (
              <Text
                style={[styles.deltaText, { color: yearDelta > 0 ? colors.primary : colors.error }]}
              >
                {yearDelta > 0
                  ? t("renter.yearsAdded", { count: yearDelta })
                  : t("renter.yearsRemoved", { count: Math.abs(yearDelta) })}
              </Text>
            )}
          </View>
        </FormScrollView>

        <View style={styles.fixedButtonBar}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving || !dirty || orderInvalid}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            accessibilityLabel={t("common.save")}
          >
            {t("common.save")}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.formPaddingHorizontal,
    gap: spacing.sm,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stepperRow: { gap: spacing.lg, flexWrap: "wrap" },
  incrementBlock: { marginTop: spacing.sm },
  warning: {
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  warningText: { flex: 1, fontSize: 13 },
  escCaption: { fontSize: 13 },
  cpiNote: { fontSize: 13, lineHeight: 18 },
  scheduleTitle: { fontWeight: "700", marginTop: spacing.md, marginBottom: spacing.xs },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: spacing.md },
  yearRow: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  yearLabel: { fontSize: 15, fontWeight: "600", minWidth: 52 },
  yearLabelCurrent: { fontWeight: "800" },
  addedAmount: { flex: 1, fontSize: 15, fontWeight: "600" },
  typeToggle: { minWidth: 56, alignItems: "center" },
  typeText: { fontSize: 13, textAlign: "center" },
  deleteButton: { padding: 4 },
  newTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
  },
  newTagText: { fontSize: 11, fontWeight: "700" },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: 6,
  },
  summaryRow: { alignItems: "center", gap: 8 },
  summaryText: { fontSize: 13, flex: 1 },
  deltaText: { fontSize: 13, fontWeight: "600" },
  fixedButtonBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 24,
  },
  saveButton: { borderRadius: 12 },
  saveButtonContent: { minHeight: 48 },
});
