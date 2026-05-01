import { darkColors, lightColors, spacing } from "@/src/core/theme";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";

type FormSectionCardProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
};

export function FormSectionCard({
  title,
  subtitle,
  children,
  containerStyle,
}: FormSectionCardProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.outline,
          borderWidth: 0,
        },
        containerStyle,
      ]}
    >
      <View style={styles.cardContent}>
        <View style={styles.titleBlock}>
          <Text
            style={[styles.sectionHeader, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleBlock: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
  },
});
