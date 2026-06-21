import { Icon } from "@/src/shared/components/ui";
import React, { useCallback } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { useTranslation } from "react-i18next";
import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
} from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";

export type DropdownItem<T extends string | number | null = string> = {
  label: string;
  value: T;
};

interface DropdownFieldProps<T extends string | number | null> {
  data: DropdownItem<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label?: string;
  placeholder?: string;
  error?: { message?: string };
  disabled?: boolean;
  inputStyle?: StyleProp<ViewStyle>;
  required?: boolean;
}

export function DropdownField<T extends string | number | null>({
  data,
  value,
  onChange,
  label,
  placeholder,
  error,
  disabled = false,
  inputStyle,
  required,
}: DropdownFieldProps<T>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const rtlLabelStyle = useRtlLabelStyle();
  const { isRtl } = useLanguageContext();

  const renderItem = useCallback(
    (item: DropdownItem<T>) => (
      <View style={[styles.itemContainer, { backgroundColor: colors.surface }]}>
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
    ),
    [colors.surface, colors.textPrimary, isRtl, rtlInputStyle],
  );

  return (
    <View style={[styles.inputWrap, inputStyle]}>
      {label ? (
        <Text
          variant="bodyMedium"
          style={[
            styles.label,
            rtlLabelStyle,
            { color: error ? colors.error : colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {label}{required ? <Text style={styles.asterisk}> *</Text> : null}
        </Text>
      ) : null}

      <View style={{ direction: "ltr" }}>
      <Dropdown
        data={data}
        labelField="label"
        valueField="value"
        value={value}
        placeholder={placeholder ?? t("common.selectItem")}
        disable={disabled}
        autoScroll={false}
        mode="default"
        renderRightIcon={isRtl ? () => null : undefined}
        renderLeftIcon={
          isRtl
            ? () => (
                <Icon
                  name="chevron-down"
                  size={20}
                  color={colors.placeholder}
                />
              )
            : undefined
        }
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
            backgroundColor: disabled
              ? colors.inputFilledBackground
              : colors.inputFilledBackground,
            borderColor: error ? colors.error : colors.outline,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        containerStyle={[
          styles.dropdownContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.outline,
          },
        ]}
        onChange={(item: DropdownItem<T>) => {
          onChange(item.value);
        }}
        renderItem={renderItem}
      />
      </View>

      {error?.message ? (
        <Text
          variant="bodySmall"
          style={[styles.errorText, { color: colors.error }]}
        >
          {t(error.message, { defaultValue: error.message })}
        </Text>
      ) : null}
    </View>
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
  asterisk: {
    color: "#B85450",
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
