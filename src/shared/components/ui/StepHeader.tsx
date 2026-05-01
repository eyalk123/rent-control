import { useLanguageContext } from "@/src/core/context";
import { darkColors, lightColors } from "@/src/core/theme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

type StepHeaderProps = {
  title: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  subtitle?: string;
};

export function StepHeader({
  title,
  currentStep,
  totalSteps,
  onBack,
  subtitle,
}: StepHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();

  const eyebrow =
    subtitle ?? t("common.step_n_of_m", { n: currentStep, m: totalSteps });

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.row,
          { flexDirection: isRtl ? "row-reverse" : "row" },
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={t("common.back")}
          accessibilityRole="button"
        >
          <Icon
            name={isRtl ? "chevron-right" : "chevron-left"}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={[styles.textBlock, isRtl ? styles.textBlockRtl : styles.textBlockLtr]}>
          <Text
            style={[styles.eyebrow, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {eyebrow.toUpperCase()}
          </Text>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        <View style={styles.spacer} />
      </View>

      <View style={styles.strip}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.segment,
              {
                backgroundColor:
                  i <= currentStep - 1 ? "#1A2D4A" : "rgba(26,45,74,0.10)",
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 8,
  },
  row: {
    alignItems: "center",
    justifyContent: "space-between",
  },
  textBlock: {
    flex: 1,
  },
  textBlockLtr: {
    marginStart: 8,
  },
  textBlockRtl: {
    marginEnd: 8,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  spacer: {
    width: 24,
  },
  strip: {
    flexDirection: "row",
    gap: 6,
    height: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
