import React from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "@/src/core/theme";

/**
 * Two fields side by side.
 *
 * Floor, Apartment, Block and Plot hold two or three characters each and were each given a
 * full-width box, which is how step one of the property form grew to eleven identical
 * rectangles. Pairing them halves the scroll and says the two belong together.
 *
 * Children share the row evenly; `flexBasis: 0` keeps the split even regardless of label
 * length. Each child keeps its own bottom margin from FormField, so the row needs none.
 */
export function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      {React.Children.map(children, (child) =>
        child ? <View style={styles.cell}>{child}</View> : null,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    // Not row-reverse under RTL: the cells are symmetric and `gap` needs no direction.
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cell: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
});
