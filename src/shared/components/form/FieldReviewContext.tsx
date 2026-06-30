import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Icon } from "@/src/shared/components/ui";

/** One field the document scanner was unsure about — keyed by its RHF field name so a
 *  form control can decorate itself. Defined here (not in the feature) so shared form
 *  components don't depend on document-scan. */
export interface FieldReviewEntry {
  formKey: string;
  source: string | null;
  confidence?: string;
}

interface FieldReview {
  source: string | null;
  confidence?: string;
}

interface Ctx {
  get: (name?: string) => FieldReview | undefined;
  dismiss: (name: string) => void;
}

const FieldReviewContext = createContext<Ctx | null>(null);

const WARNING = "#B45309";

/** Wraps a form so its fields can flag values the scanner pre-filled with low confidence.
 *  A field's marker clears once the user edits it (the value has been verified). */
export function FieldReviewProvider({
  items,
  children,
}: {
  items?: FieldReviewEntry[];
  children: React.ReactNode;
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  const map = useMemo(() => {
    const m = new Map<string, FieldReview>();
    for (const it of items ?? []) {
      if (it.formKey) m.set(it.formKey, { source: it.source, confidence: it.confidence });
    }
    return m;
  }, [items]);

  useEffect(() => {
    setDismissed(new Set());
  }, [items]);

  const value = useMemo<Ctx>(
    () => ({
      get: (name) => (name && !dismissed.has(name) ? map.get(name) : undefined),
      dismiss: (name) =>
        setDismissed((prev) => (prev.has(name) ? prev : new Set(prev).add(name))),
    }),
    [map, dismissed],
  );

  return <FieldReviewContext.Provider value={value}>{children}</FieldReviewContext.Provider>;
}

/** A form control reads this by its field name; non-undefined means "flag this field". */
export function useFieldReview(name?: string): FieldReview | undefined {
  return useContext(FieldReviewContext)?.get(name);
}

/** Call when the user edits a flagged field so its marker clears. */
export function useDismissFieldReview(): ((name: string) => void) | undefined {
  return useContext(FieldReviewContext)?.dismiss;
}

/** The warning border color a flagged control should use. */
export const FIELD_REVIEW_COLOR = WARNING;

/** Small inline chip placed next to a flagged field's label. */
export function FieldReviewBadge() {
  const { t } = useTranslation();
  return (
    <View style={styles.badge}>
      <Icon name="alert-circle" size={11} color={WARNING} />
      <Text style={styles.badgeText}>{t("documentScan.reviewBadge")}</Text>
    </View>
  );
}

/** Source snippet shown beneath a flagged field. */
export function FieldReviewSource({ source }: { source: string | null }) {
  const { t } = useTranslation();
  if (!source) return null;
  return (
    <Text variant="bodySmall" style={styles.source}>
      ↳ {t("documentScan.foundIn", { snippet: source })}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: "rgba(234,179,8,0.16)",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: WARNING,
  },
  source: {
    marginTop: 4,
    color: WARNING,
    opacity: 0.9,
  },
});
