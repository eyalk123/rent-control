import { useLanguageContext, useSectionHeaderStyle } from "@/src/context";
import { darkColors, lightColors, spacing } from "@/src/theme";
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
  
  // You can keep this if you need it for 'children', 
  // but it's no longer needed for the header layout!
  const { isRtl } = useLanguageContext(); 

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.outline,
          borderWidth: 1,
        },
        containerStyle,
      ]}
    >
      <View style={styles.cardContent}>
        <View
          style={[
            sectionHeaderStyle.containerStyle,
            {
              flexDirection: "row", // React Native auto-mirrors this in RTL
              alignItems: "center",
              gap: spacing.sm, // Creates consistent space BETWEEN the accent and title
              marginEnd: spacing.sm, // Replaced marginRight with logical marginEnd
            },
          ]}
        >
          <View
            style={[
              styles.sectionAccent,
              {
                backgroundColor: colors.sectionAccent,
                // Removed margin completely from here, gap handles it now
              },
            ]}
          />
          <Text
            variant="titleLarge"
            style={[
              styles.sectionHeader,
              sectionHeaderStyle.textStyle,
              {
                textAlign: "left", // React Native auto-mirrors this in RTL
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
    marginBottom: spacing.xl,
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