import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useLanguageContext, useRtlLabelStyle } from "@/src/core/context";

type StepperProps = {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Optional one-tap shortcut values rendered as chips beside the control. */
  quickValues?: number[];
  /** Short unit shown next to the value, e.g. "yrs". */
  unitLabel?: string;
};

function StepperInner({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  quickValues,
  unitLabel,
}: StepperProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();

  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const atMin = value <= min;
  const atMax = value >= max;
  const rowDirection = isRtl ? "row-reverse" : "row";

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

      {/* The app forces native RTL (I18nManager.forceRTL), so a plain "row" already packs the
          control at the correct (right) edge in Hebrew. A manual row-reverse here double-flips
          it back to the left — visible when the Stepper is full-width (e.g. the renter form). */}
      <View style={[styles.row, { flexDirection: "row" }]}>
        <View
          style={[
            styles.control,
            {
              flexDirection: rowDirection,
              borderColor: colors.outline,
              backgroundColor: colors.inputFilledBackground,
            },
          ]}
        >
          <Pressable
            onPress={() => onChange(clamp(value - 1))}
            disabled={atMin}
            hitSlop={6}
            style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text
              style={[styles.btnText, { color: atMin ? colors.placeholder : colors.primary }]}
            >
              −
            </Text>
          </Pressable>

          <View style={styles.valueWrap}>
            <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
            {unitLabel ? (
              <Text style={[styles.unit, { color: colors.textSecondary }]}>{unitLabel}</Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => onChange(clamp(value + 1))}
            disabled={atMax}
            hitSlop={6}
            style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text
              style={[styles.btnText, { color: atMax ? colors.placeholder : colors.primary }]}
            >
              +
            </Text>
          </Pressable>
        </View>

        {quickValues && quickValues.length > 0 ? (
          <View style={[styles.chips, { flexDirection: rowDirection }]}>
            {quickValues.map((q) => {
              const active = q === value;
              return (
                <Pressable
                  key={q}
                  onPress={() => onChange(clamp(q))}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? colors.primary : colors.outline,
                      backgroundColor: active ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.onPrimary : colors.textSecondary,
                      fontWeight: "600",
                    }}
                  >
                    {q}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export const Stepper = React.memo(StepperInner);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 6,
    fontWeight: "500",
  },
  row: {
    alignItems: "center",
    gap: spacing.sm,
  },
  control: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  btn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "600",
  },
  valueWrap: {
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
  },
  unit: {
    fontSize: 11,
    marginTop: -2,
  },
  chips: {
    alignItems: "center",
    gap: spacing.xs,
  },
  chip: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
