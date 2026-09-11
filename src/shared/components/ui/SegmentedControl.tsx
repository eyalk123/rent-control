import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { darkColors, lightColors, spacing, MAX_CHROME_FONT_SCALE } from "@/src/core/theme";
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
  /**
   * Size each segment to its label (proportional) instead of equal columns. Helps when there
   * are many segments and equal widths would truncate the longer labels. Off by default so
   * short segment sets keep their tidy even columns.
   */
  fitContent?: boolean;
  /** Override the default bottom margin when the control is already inside a FormField. */
  style?: StyleProp<ViewStyle>;
};

function SegmentedControlInner<T extends string>({
  segments,
  value,
  onChange,
  label,
  fitContent = false,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text
          variant="bodyMedium"
          style={[styles.label, rtlLabelStyle, { color: colors.fieldLabel }]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.track,
          {
            flexDirection: isRtl ? "row-reverse" : "row",
            // Unfilled, like every other field. The track used to be inputFilledBackground,
            // which put the inactive labels on a surface where textSecondary measured
            // 4.36:1 - under the 4.5:1 text floor. On the card behind it they read 4.83:1,
            // and the control stops being the only filled box on an otherwise outlined form.
            backgroundColor: "transparent",
            borderColor: colors.inputBorder,
          },
        ]}
      >
        {segments.map((seg) => {
          const active = seg.value === value;
          return (
            <Pressable
              key={seg.value}
              onPress={() => onChange(seg.value)}
              style={[
                styles.segment,
                fitContent ? styles.segmentFit : styles.segmentEqual,
                active && { backgroundColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
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
  // Matches form/FormField: one label treatment across every control on a form card.
  label: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: "500",
  },
  track: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segment: {
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  // Equal columns: flexBasis 0% makes flexbox ignore label length and split evenly.
  segmentEqual: {
    flex: 1,
  },
  // Content-aware: each segment starts at its label width (flexBasis auto), then shares the
  // leftover space — so short labels (e.g. "CPI") free room for longer ones.
  segmentFit: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "500",
  },
  segmentTextActive: {
    fontWeight: "700",
  },
});
