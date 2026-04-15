import { useLanguageContext, useSectionHeaderStyle } from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Text, useTheme } from "react-native-paper";

type FormSectionCardProps = {
  title: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
};

export function FormSectionCard({
  title,
  children,
  containerStyle,
}: FormSectionCardProps) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const sectionHeaderStyle = useSectionHeaderStyle();
  
  const { isRtl } = useLanguageContext(); 

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
        <View
          style={[
            sectionHeaderStyle.containerStyle,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginEnd: spacing.sm,
            },
          ]}
        >
          <View
            style={[
              styles.sectionAccent,
              {
                backgroundColor: colors.sectionAccent,
              },
            ]}
          />
          <Text
            variant="titleLarge"
            style={[
              styles.sectionHeader,
              sectionHeaderStyle.textStyle,
              {
                textAlign: "left",
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
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
  sectionHeader: {
    flexShrink: 1,
    fontWeight: "700",
    flex: 1,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
});
