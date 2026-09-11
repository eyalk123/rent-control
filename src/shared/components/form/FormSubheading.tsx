import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRtlLabelStyle } from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";

/**
 * Groups a run of fields inside one card.
 *
 * A section card used to be a single flat list - address, floor, apartment, city, block, plot,
 * owner, zip, type, size - with an identical 12px gap between every pair, so Address and Block
 * carried the same weight. Per MOBILE-DESIGN.md §6 the fix is not another card: whitespace and
 * a hairline group content without stacking shadows.
 */
export function FormSubheading({ title }: { title: string }) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <View style={styles.wrap}>
      <View style={[styles.rule, { backgroundColor: colors.outline }]} />
      <Text style={[styles.title, rtlLabelStyle, { color: colors.fieldLabel }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
