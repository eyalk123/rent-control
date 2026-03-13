import { FormInput } from "@/src/components/form/FormInput";
import { FormChipInput } from "@/src/components/form/FormChipInput";
import { useRtlPlaceholder, useSectionHeaderStyle } from "@/src/context";
import { darkColors, lightColors, spacing } from "@/src/theme";
import type { TFunction } from "i18next";
import React from "react";
import type { Control, FieldValues } from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

type LeaseInfoCardProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  t: TFunction;
};

function LeaseInfoCardInner<TFieldValues extends FieldValues>({
  control,
  t,
}: LeaseInfoCardProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const sectionHeaderStyle = useSectionHeaderStyle();
  const rtlPlaceholder = useRtlPlaceholder();

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.outline,
          borderWidth: 1,
        },
      ]}
    >
      <View style={styles.cardContent}>
        <View
          style={[
            sectionHeaderStyle.containerStyle,
            { flexDirection: "row", alignItems: "center" },
          ]}
        >
          <View
            style={[
              styles.sectionAccent,
              {
                backgroundColor: colors.sectionAccent,
                marginEnd: spacing.sm,
              },
            ]}
          />
          <Text
            variant="titleLarge"
            style={[styles.sectionHeader, sectionHeaderStyle.textStyle]}
            numberOfLines={1}
          >
            {t("property.leaseInfo")}
          </Text>
        </View>
        <View
          style={[
            sectionHeaderStyle.containerStyle,
            {
              marginTop: spacing.sm,
              flexDirection: "row",
              alignItems: "center",
            },
          ]}
        />
        <FormInput
          control={control}
          name={"numberOfRooms" as any}
          label={t("property.numberOfRooms")}
          keyboardType="numeric"
        />
        <FormChipInput
          control={control}
          name={"parkingNumbersStr" as any}
          label={t("property.parkingNumbers")}
          placeholder={rtlPlaceholder(t("property.parkingNumbersPlaceholder"))}
        />
        <FormInput
          control={control}
          name={"electricityMeterNumber" as any}
          label={t("property.electricityMeterNumber")}
        />
        <FormInput
          control={control}
          name={"waterMeterTax" as any}
          label={t("property.waterMeterTax")}
          keyboardType="decimal-pad"
        />
        <FormInput
          control={control}
          name={"propertyTax" as any}
          label={t("property.propertyTax")}
          keyboardType="decimal-pad"
        />
        <FormInput
          control={control}
          name={"houseCommittee" as any}
          label={t("property.houseCommittee")}
          keyboardType="decimal-pad"
        />
      </View>
    </View>
  );
}

export const LeaseInfoCard = React.memo(LeaseInfoCardInner) as typeof LeaseInfoCardInner;

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: spacing.xl,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    flexShrink: 1,
    fontWeight: "700",
  },
  subSectionHeader: {
    flexShrink: 1,
    fontWeight: "600",
    opacity: 0.9,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
});