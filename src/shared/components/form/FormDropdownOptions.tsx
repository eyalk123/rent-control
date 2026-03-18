import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
} from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
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

type Option = {
  label: string;
  value: string;
};

type FormDropdownOptionsProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  options: Option[];
  placeholder?: string;
};

export function FormDropdownOptions<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
}: FormDropdownOptionsProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();

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

          <View style={{ direction: "ltr" }}>
            <Dropdown
              data={options}
              labelField="label"
              valueField="value"
              value={(value as string) ?? null}
              placeholder={placeholder}
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
                {
                  textAlign: isRtl ? "right" : "left",
                  color: colors.textPrimary,
                },
              ]}
              itemTextStyle={[rtlInputStyle, { color: colors.textPrimary }]}
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.inputFilledBackground,
                  borderColor: error ? colors.error : colors.outline,
                },
              ]}
              containerStyle={[
                styles.dropdownContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                },
              ]}
              onChange={(item: Option) => {
                onChange(item.value);
              }}
              renderItem={(item: Option) => (
                <View
                  style={[
                    styles.itemContainer,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <Text
                    style={[
                      styles.itemText,
                      rtlInputStyle,
                      {
                        textAlign: isRtl ? "right" : "left",
                        width: "100%",
                        color: colors.textPrimary,
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
    minHeight: 48,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 4,
  },
  placeholder: {
    fontSize: 16,
  },
  selectedText: {
    fontSize: 16,
  },
  itemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemText: {
    fontSize: 16,
  },
});

