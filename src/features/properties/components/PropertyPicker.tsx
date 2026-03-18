import React, { useMemo } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { usePropertyContext } from "@/src/context";
import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
  useRtlPlaceholder,
} from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { Dropdown } from "react-native-element-dropdown";
import { Text, useTheme } from "react-native-paper";

interface PropertyPickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
  error?: { message?: string };
}

export function PropertyPicker({
  value,
  onChange,
  label,
  inputStyle,
  error,
}: PropertyPickerProps) {
  const { t } = useTranslation();
  const { properties } = usePropertyContext();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const rtlLabelStyle = useRtlLabelStyle();
  const rtlPlaceholder = useRtlPlaceholder();
  const { isRtl } = useLanguageContext();

  const dropdownData = useMemo<{ label: string; value: number | null }[]>(
    () => [
      { label: t("renter.unassigned"), value: null },
      ...properties.map((p) => ({
        label: `${p.address} - ${p.city}`,
        value: p.id as number,
      })),
    ],
    [properties, t],
  );

  return (
    <View style={[styles.inputWrap, inputStyle]}>
      <Text
        variant="bodyMedium"
        style={[
          styles.label,
          rtlLabelStyle,
          { color: error ? colors.error : colors.textPrimary },
        ]}
        numberOfLines={1}
      >
        {label ?? t("renter.property")}
      </Text>

      <View style={{ direction: "ltr" }}>
        <Dropdown
          data={dropdownData}
          labelField="label"
          valueField="value"
          value={value}
          placeholder={rtlPlaceholder(t("renter.unassigned"))}
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
          onChange={(item: { label: string; value: number | null }) => {
            onChange(item.value);
          }}
          renderItem={(item: { label: string; value: number | null }) => (
            <View
              style={[styles.itemContainer, { backgroundColor: colors.surface }]}
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

      {error?.message ? (
        <Text
          variant="bodySmall"
          style={[styles.errorText, { color: colors.error }]}
        >
          {error.message}
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
