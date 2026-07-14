import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import {
  LoadingOverlay,
  ScreenContainer,
  StepHeader,
  Stepper,
  Icon,
} from "@/src/shared/components/ui";
import { FormScrollView, RentChangeField, LeaseYearRow } from "@/src/shared/components/form";
import { darkColors, lightColors, spacing, ICON_SM } from "@/src/core/theme";
import { useLanguageContext, useAlert } from "@/src/core/context";
import { useRenterContext } from "@/src/context";
import { getRenterById, updateRenter } from "@/src/features/renters/api/renters";
import { getApiErrorMessage } from "@/src/core/api/client";
import {
  buildAddedYears,
  hasContractAfterOptionYear,
  isProjectedYear,
  materializeRuledYears,
  reconstructIntentFromLeaseYears,
} from "@/src/shared/utils/leaseSchedule";
import { getLeaseEndDate, type LeaseYear, type LeaseYearRuleMode, type LeaseYearType, type RentEscalationMode, type Renter } from "@/src/shared/types";
import { getLeaseYearLabel, isCurrentLeaseYear } from "@/src/shared/utils/leaseYear";
import { formatDateFull } from "@/src/shared/utils/dates";

type Row = {
  amount: string;
  type: LeaseYearType;
  /** Custom mode only: how this year derives from the previous one. Absent = manual. */
  rule?: { mode: LeaseYearRuleMode; value: string };
};

/**
 * Rows -> the numeric model the schedule helpers work on. Rules only mean anything in custom
 * mode, so `withRules: false` drops them — leaving custom mode discards them rather than
 * letting them ride along into a percent/fixed lease.
 */
function toModel(rows: Row[], withRules = true): LeaseYear[] {
  return rows.map((r) => {
    const year: LeaseYear = { amount: Number(r.amount) || 0, type: r.type };
    if (withRules && r.rule && r.rule.mode !== "manual") {
      year.rule = { mode: r.rule.mode, value: Number(r.rule.value) || 0 };
    }
    return year;
  });
}

/** A percent/fixed rule with no number behind it can't price its year. */
function ruleValueMissing(rows: Row[]): boolean {
  return rows.some(
    (r) => (r.rule?.mode === "percent" || r.rule?.mode === "fixed") && !r.rule.value.trim(),
  );
}

/**
 * Focused lease-extension screen. Shows the current lease, grows it via a single "years to
 * add" number input (auto-priced from the lease's existing escalation) and lets the owner
 * edit/delete/convert the existing years, then saves the whole schedule via PATCH — no full
 * renter edit needed. Reached from the renter detail header and the "Update lease"
 * expiring-lease notification.
 *
 * Offers the same escalation modes as the renter form (RentChangeField): in "custom" mode the
 * new years become hand-editable too, so every amount in the schedule can be priced by hand.
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
  const [addedRows, setAddedRows] = React.useState<Row[]>([]);
  const [mode, setMode] = React.useState<RentEscalationMode>("none");
  const [value, setValue] = React.useState("");
  const [addCount, setAddCount] = React.useState(0);
  const [addOptionCount, setAddOptionCount] = React.useState(0);

  const initialSnapshot = React.useRef("");
  const savedRef = React.useRef(false);

  // Load the renter and seed local state. Prefer the persisted escalation rule; fall back to
  // what the saved schedule implies. The saved mode is kept as-is (including "custom"/"cpi") —
  // coercing it here would silently rewrite the renter's escalation rule on the next save.
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
          ...(y.rule
            ? { rule: { mode: y.rule.mode, value: y.rule.value != null ? String(y.rule.value) : "" } }
            : {}),
        }));
        const seededMode: RentEscalationMode =
          data.rent_escalation_mode ?? reconstructIntentFromLeaseYears(data.lease_years).escalationMode;
        const seededValue = data.rent_escalation_value != null ? String(data.rent_escalation_value) : "";
        setExistingRows(seededRows);
        setAddedRows([]);
        setMode(seededMode);
        setValue(seededValue);
        setAddCount(0);
        setAddOptionCount(0);
        initialSnapshot.current = JSON.stringify({ rows: seededRows, added: [], mode: seededMode, value: seededValue });
      })
      .catch((err) => appAlert(t("error.title"), getApiErrorMessage(err, t("error.loadFailed"))))
      .finally(() => setLoading(false));
  }, [id]);

  const isCustom = mode === "custom";

  // In custom mode every ruled year is *derived* from the year before it, so the schedule is a
  // pure function of the rows — walk it rather than storing the computed amounts. Hand-typed
  // ("manual") amounts are what the walk reads; everything else it writes.
  const existingYears: LeaseYear[] = React.useMemo(() => {
    const model = toModel(existingRows, isCustom);
    return isCustom ? materializeRuledYears(model, model[0]?.amount ?? 0) : model;
  }, [existingRows, isCustom]);

  // New-year pricing walks the escalation rule forward from the last existing amount, so the
  // derivation only needs the tail of the schedule — and only re-runs when that amount
  // changes, not on every keystroke in every row.
  const lastExistingAmount =
    existingYears.length > 0 ? existingYears[existingYears.length - 1].amount : 0;

  // New years grow/shrink reactively with the number inputs — no explicit "add" action.
  // In custom mode the owner hand-prices them (or gives them a rule), so re-deriving preserves
  // what they typed and chose.
  React.useEffect(() => {
    setAddedRows((prev) => {
      const next = buildAddedYears(
        [{ amount: lastExistingAmount, type: "contract" }],
        addCount,
        addOptionCount,
        mode,
        Number(value) || 0,
        mode === "custom" ? toModel(prev) : undefined,
      );
      return next.map((y, i) => ({
        amount: mode === "custom" && prev[i] ? prev[i].amount : String(y.amount),
        type: y.type,
        ...(mode === "custom" && prev[i]?.rule ? { rule: prev[i].rule } : {}),
      }));
    });
  }, [addCount, addOptionCount, mode, value, lastExistingAmount]);

  // The added block prices off the last existing year, so in custom mode the two halves have
  // to be walked together and the added tail taken from the result.
  const addedYears: LeaseYear[] = React.useMemo(() => {
    const model = toModel(addedRows, isCustom);
    if (!isCustom) return model;
    return materializeRuledYears(
      [...existingYears, ...model],
      existingYears[0]?.amount ?? model[0]?.amount ?? 0,
    ).slice(existingYears.length);
  }, [addedRows, existingYears, isCustom]);

  const allYears: LeaseYear[] = React.useMemo(() => [...existingYears, ...addedYears], [existingYears, addedYears]);

  /** A ruled year shows the walked amount; a manual one shows exactly what was typed. */
  const displayAmount = (row: Row, walked: LeaseYear | undefined) =>
    isCustom && row.rule && row.rule.mode !== "manual" ? String(walked?.amount ?? 0) : row.amount;

  const orderInvalid = React.useMemo(() => hasContractAfterOptionYear(allYears), [allYears]);
  // The renter form gets this from Zod; this screen has no schema, so it gates Save by hand.
  const ruleIncomplete = React.useMemo(
    () => isCustom && ruleValueMissing([...existingRows, ...addedRows]),
    [isCustom, existingRows, addedRows],
  );

  const dirty =
    JSON.stringify({ rows: existingRows, added: addedRows, mode, value }) !== initialSnapshot.current;

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

  /** Typing an amount by hand means the stated rule no longer describes it — drop to manual. */
  const setAmount = (rows: Row[], index: number, amount: string): Row[] =>
    rows.map((r, i) => (i === index ? { amount, type: r.type } : r));

  const setRule = (rows: Row[], index: number, ruleMode: LeaseYearRuleMode): Row[] =>
    rows.map((r, i) =>
      i === index
        ? ruleMode === "manual"
          ? { amount: r.amount, type: r.type }
          : { ...r, rule: { mode: ruleMode, value: r.rule?.value ?? "" } }
        : r,
    );

  const setRuleValue = (rows: Row[], index: number, ruleValue: string): Row[] =>
    rows.map((r, i) => (i === index && r.rule ? { ...r, rule: { ...r.rule, value: ruleValue } } : r));

  const updateAmount = (index: number, amount: string) =>
    setExistingRows((prev) => setAmount(prev, index, amount));

  const removeRow = (index: number) => setExistingRows((prev) => prev.filter((_, i) => i !== index));

  const toggleType = (index: number) => {
    Haptics.selectionAsync();
    setExistingRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, type: r.type === "contract" ? "option" : "contract" } : r)),
    );
  };

  const updateAddedAmount = (index: number, amount: string) =>
    setAddedRows((prev) => setAmount(prev, index, amount));

  const handleSave = async () => {
    if (!renter || orderInvalid || ruleIncomplete) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaving(true);
    try {
      await updateRenter(renter.id, {
        lease_years: allYears,
        contract_term_years: allYears.filter((y) => y.type === "contract").length,
        option_years: allYears.filter((y) => y.type === "option").length,
        rent_escalation_mode: mode,
        // Only percent/fixed carry a step; none/cpi/custom must not keep a stale one.
        rent_escalation_value: (mode === "percent" || mode === "fixed") && value ? Number(value) : null,
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
              <RentChangeField
                label={t("renter.newYearIncrement")}
                fitContent
                mode={mode}
                onModeChange={setMode}
                value={value}
                onValueChange={setValue}
              />
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
              {/* Existing years — editable amount, deletable, type convertible. In custom
                  mode each year past the first also carries its own rule. */}
              {existingRows.map((row, index) => (
                <LeaseYearRow
                  key={`existing-${index}`}
                  label={getLeaseYearLabel(leaseStart, index)}
                  amount={displayAmount(row, existingYears[index])}
                  type={row.type}
                  isCurrent={isCurrentLeaseYear(leaseStart, index)}
                  onAmountChange={(v) => updateAmount(index, v)}
                  onTypeToggle={() => toggleType(index)}
                  onRemove={() => removeRow(index)}
                  projected={isCustom && isProjectedYear(allYears, index)}
                  // Year one is the base rent — nothing to derive it from.
                  ruleMode={row.rule?.mode ?? "manual"}
                  onRuleChange={
                    isCustom && index > 0
                      ? (m) => setExistingRows((prev) => setRule(prev, index, m))
                      : undefined
                  }
                  ruleValue={row.rule?.value ?? ""}
                  onRuleValueChange={(v) => setExistingRows((prev) => setRuleValue(prev, index, v))}
                  rowDirection={rowDirection}
                />
              ))}
              {/* Added years — auto-priced from the escalation rule, except in custom mode
                  where the owner prices them by hand or gives each its own rule. */}
              {addedRows.map((row, j) => {
                const absoluteIndex = existingRows.length + j;
                return (
                  <LeaseYearRow
                    key={`added-${j}`}
                    label={getLeaseYearLabel(leaseStart, absoluteIndex)}
                    amount={displayAmount(row, addedYears[j])}
                    type={row.type}
                    onAmountChange={isCustom ? (v) => updateAddedAmount(j, v) : undefined}
                    // CPI amounts are index-linked and priced server-side — a client-side
                    // figure here is only an estimate. In custom mode that's true of a CPI
                    // year and everything downstream of it.
                    projected={isCustom ? isProjectedYear(allYears, absoluteIndex) : mode === "cpi"}
                    ruleMode={row.rule?.mode ?? "manual"}
                    onRuleChange={
                      isCustom && absoluteIndex > 0
                        ? (m) => setAddedRows((prev) => setRule(prev, j, m))
                        : undefined
                    }
                    ruleValue={row.rule?.value ?? ""}
                    onRuleValueChange={(v) => setAddedRows((prev) => setRuleValue(prev, j, v))}
                    badge={
                      <View style={[styles.newTag, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.newTagText, { color: colors.onPrimary }]}>
                          {t("renter.newYearTag")}
                        </Text>
                      </View>
                    }
                    rowDirection={rowDirection}
                  />
                );
              })}

              {isCustom && isProjectedYear(allYears, allYears.length - 1) ? (
                <Text style={[styles.projectedNote, { color: colors.textSecondary }]}>
                  {t("renter.cpiProjectedNote")}
                </Text>
              ) : null}
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
            disabled={saving || !dirty || orderInvalid || ruleIncomplete}
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
  scheduleTitle: { fontWeight: "700", marginTop: spacing.md, marginBottom: spacing.xs },
  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: spacing.md },
  projectedNote: { fontSize: 13, lineHeight: 18, marginTop: spacing.sm },
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
