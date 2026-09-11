import { useLanguageContext } from "@/src/core/context";
import { darkColors, lightColors, MAX_CHROME_FONT_SCALE } from "@/src/core/theme";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

type FormHeaderProps = {
  title: string;
  onBack: () => void;
  /**
   * Step position. Both or neither — omit them on a single-page form and the progress strip
   * is not drawn. A one-of-one strip is a full bar that says nothing, which is what the
   * document-scan screen used to render.
   */
  currentStep?: number;
  totalSteps?: number;
  /** Replaces the "Step n of m" eyebrow. On a single-page form it is the only eyebrow. */
  subtitle?: string;
};

/**
 * The header every add/edit form screen wears.
 *
 * Was `StepHeader`, and only the property and renter forms used it — the transaction forms
 * had a bare back chevron with their title buried inside the first card, and the transaction
 * chooser had no header at all. Three chrome patterns across four forms. The step strip is
 * what is optional here; the title, the back affordance and the spacing are not.
 */
export function FormHeader({
  title,
  currentStep,
  totalSteps,
  onBack,
  subtitle,
}: FormHeaderProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();

  const showStrip = totalSteps != null && totalSteps > 1 && currentStep != null;
  const eyebrow =
    subtitle ??
    (showStrip ? t("common.step_n_of_m", { n: currentStep, m: totalSteps }) : null);

  return (
    <View style={styles.container}>
      <View style={[styles.row, { flexDirection: isRtl ? "row-reverse" : "row" }]}>
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
          {eyebrow ? (
            <Text
              maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
              style={[styles.eyebrow, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {eyebrow.toUpperCase()}
            </Text>
          ) : null}
          <Text
            maxFontSizeMultiplier={MAX_CHROME_FONT_SCALE}
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>

        <View style={styles.spacer} />
      </View>

      {/* Both colours come from the palette. They were navy literals, so on the dark theme
          the filled segment measured 1.25:1 against the page and the empty one 1.02:1 - the
          progress bar simply was not there. */}
      {showStrip ? (
        <View style={styles.strip}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                {
                  backgroundColor:
                    i <= currentStep - 1 ? colors.primary : colors.inputBorder,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
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
