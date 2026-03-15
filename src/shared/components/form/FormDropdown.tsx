import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
  useRtlPlaceholder,
} from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { PROPERTY_TYPES } from "@/src/features/properties/validation/propertyValidation";
import type { PropertyType } from "@/src/shared/types";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";

type FormDropdownProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  translateTypeLabel: (type: PropertyType) => string;
  placeholderKey: string;
};

export function FormDropdown<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  translateTypeLabel,
  placeholderKey,
}: FormDropdownProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const rtlPlaceholder = useRtlPlaceholder();
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();

  const dropdownData = React.useMemo<
    { label: string; value: PropertyType }[]
  >(
    () =>
      PROPERTY_TYPES.map((ty) => ({
        label: translateTypeLabel(ty),
        value: ty,
      })),
    [translateTypeLabel],
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <View style={styles.inputWrap}>
          <Text
            variant="bodyMedium"
            style={[
              styles.label,
              rtlLabelStyle,
              { color: error ? colors.error : colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>

          {/* The key fix: LTR wrapper matching your FormInput */}
          <View style={{ direction: "ltr" }}>
            <Dropdown
              data={dropdownData}
              labelField="label"
              valueField="value"
              value={value as PropertyType | null}
              placeholder={rtlPlaceholder(placeholderKey)}
              placeholderStyle={[
                styles.placeholder,
                rtlInputStyle,
                {
                  color: colors.placeholder,
                  textAlign: isRtl ? "right" : "left",
                },
              ]}
              selectedTextStyle={[
                styles.selectedText,
                rtlInputStyle,
                { textAlign: isRtl ? "right" : "left" },
              ]}
              itemTextStyle={rtlInputStyle}
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.inputFilledBackground,
                  borderColor: error ? colors.error : colors.outline,
                  // If you want the chevron icon to move to the left in RTL, uncomment the next line:
                  // flexDirection: isRtl ? "row-reverse" : "row",
                },
              ]}
              containerStyle={styles.dropdownContainer}
              onChange={(item: { label: string; value: PropertyType }) => {
                onChange(item.value);
              }}
              renderItem={(item: { label: string; value: PropertyType }) => (
                <View style={styles.itemContainer}>
                  <Text
                    style={[
                      styles.itemText,
                      rtlInputStyle,
                      {
                        textAlign: isRtl ? "right" : "left",
                        width: "100%", // Ensures text can actually align right within the item box
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              )}
              mode="default"
              disable={false}
              autoScroll={false}
            />
          </View>

          {error ? (
            <Text
              variant="bodySmall"
              style={[styles.errorText, { color: colors.error }]}
            >
              {error.message}
            </Text>
          ) : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
    fontWeight: "500",
  },
  errorText: {
    marginTop: 4,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48, // Matched roughly to your standard input height
  },
  dropdownContainer: {
    borderRadius: 4,
  },
  placeholder: {
    fontSize: 16,
  },
  selectedText: {
    fontSize: 16,
    color: "auto", // Or tie to colors.textPrimary
  },
  itemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemText: {
    fontSize: 16,
  },
});