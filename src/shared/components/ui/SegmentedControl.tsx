import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useLanguageContext, useRtlLabelStyle } from "@/src/core/context";

export type Segment<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  label?: string;
};

function SegmentedControlInner<T extends string>({
  segments,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <View style={styles.container}>
      {label ? (
        <Text
          variant="bodyMedium"
          style={[styles.label, rtlLabelStyle, { color: colors.textPrimary }]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.track,
          {
            flexDirection: isRtl ? "row-reverse" : "row",
            backgroundColor: colors.inputFilledBackground,
            borderColor: colors.outline,
          },
        ]}
      >
        {segments.map((seg) => {
          const active = seg.value === value;
          return (
            <Pressable
              key={seg.value}
              onPress={() => onChange(seg.value)}
              style={[styles.segment, active && { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.segmentText,
                  { color: active ? colors.onPrimary : colors.textSecondary },
                  active && styles.segmentTextActive,
                ]}
              >
                {seg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export const SegmentedControl = React.memo(
  SegmentedControlInner,
) as typeof SegmentedControlInner;

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 6,
    fontWeight: "500",
  },
  track: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
  },
  segmentTextActive: {
    fontWeight: "700",
  },
});
