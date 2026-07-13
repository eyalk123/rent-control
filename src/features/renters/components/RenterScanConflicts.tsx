import React from "react";
import { StyleSheet, View } from "react-native";
import { SegmentedButtons, Text, useTheme } from "react-native-paper";
import type { TFunction } from "i18next";
import { spacing } from "@/src/core/theme";
import type { RenterFieldConflict } from "@/src/features/document-scan/diffRenter";
import { formatConflictValue } from "@/src/features/document-scan/conflictValue";
import { fileNameFromUrl } from "@/src/shared/utils/fileName";

/** Keep/use-lease chooser for the fields where a re-scanned lease disagrees with the existing
 *  renter it matched. Mirrors the property conflict block on the scan summary. */
export function RenterScanConflicts({
  conflicts,
  choices,
  onResolve,
  contractConflict,
  contractChoice,
  onResolveContract,
  scannedFileName,
  t,
}: {
  conflicts: RenterFieldConflict[];
  choices: Record<string, "keep" | "update">;
  onResolve: (formKey: string, mode: "keep" | "update") => void;
  /** Set when the matched renter already has a contract file and the scan brought a new one. */
  contractConflict?: { existingUrl: string } | null;
  contractChoice?: "keep" | "update";
  onResolveContract?: (mode: "keep" | "update") => void;
  scannedFileName?: string;
  t: TFunction;
}) {
  const theme = useTheme();
  if (conflicts.length === 0 && !contractConflict) return null;
  return (
    <View style={[styles.box, { borderColor: theme.colors.outline }]}>
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
        {t("documentScan.conflictsTitle")}
      </Text>
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.sm }}
      >
        {t("documentScan.renterConflictsHint")}
      </Text>
      {conflicts.map((c) => (
        <View key={c.formKey} style={{ gap: 4, marginTop: spacing.xs }}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {t(c.labelKey)}
          </Text>
          <SegmentedButtons
            value={choices[c.formKey] ?? "keep"}
            onValueChange={(v) => onResolve(c.formKey, v as "keep" | "update")}
            buttons={[
              { value: "keep", label: t("documentScan.fieldKeepExisting", { value: formatConflictValue(c.formKey, c.existing, t) }) },
              { value: "update", label: t("documentScan.fieldUseLease", { value: formatConflictValue(c.formKey, c.scanned, t) }) },
            ]}
          />
        </View>
      ))}
      {contractConflict && onResolveContract && (
        <View style={{ gap: 4, marginTop: spacing.xs }}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {t("documents.fullContract")}
          </Text>
          <SegmentedButtons
            value={contractChoice ?? "keep"}
            onValueChange={(v) => onResolveContract(v as "keep" | "update")}
            buttons={[
              { value: "keep", label: t("documentScan.fieldKeepExisting", { value: fileNameFromUrl(contractConflict.existingUrl) }) },
              { value: "update", label: t("documentScan.fieldUseLease", { value: scannedFileName ?? "" }) },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
});
