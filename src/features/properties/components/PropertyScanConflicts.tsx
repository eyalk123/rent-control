import React from "react";
import { StyleSheet, View } from "react-native";
import { SegmentedButtons, Text, useTheme } from "react-native-paper";
import type { TFunction } from "i18next";
import { spacing } from "@/src/core/theme";
import type { PropertyFormFieldConflict } from "@/src/features/document-scan/diffProperty";

/** Keep/use-lease chooser for the fields where a re-scanned lease disagrees with the existing
 *  property it matched. Mirrors the renter form's `RenterScanConflicts`. */
export function PropertyScanConflicts({
  conflicts,
  choices,
  onResolve,
  t,
}: {
  conflicts: PropertyFormFieldConflict[];
  choices: Record<string, "keep" | "update">;
  onResolve: (formKey: string, mode: "keep" | "update") => void;
  t: TFunction;
}) {
  const theme = useTheme();
  if (conflicts.length === 0) return null;
  return (
    <View style={[styles.box, { borderColor: theme.colors.outline }]}>
      <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
        {t("documentScan.conflictsTitle")}
      </Text>
      <Text
        variant="bodySmall"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: spacing.sm }}
      >
        {t("documentScan.conflictsHint")}
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
              { value: "keep", label: t("documentScan.fieldKeepExisting", { value: c.existing }) },
              { value: "update", label: t("documentScan.fieldUseLease", { value: c.scanned }) },
            ]}
          />
        </View>
      ))}
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
