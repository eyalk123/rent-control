import { Icon } from "@/src/shared/components/ui";
import React, { useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { useTranslation } from "react-i18next";
import { useLanguageContext, useRtlInputStyle } from "@/src/core/context";
import { darkColors, lightColors } from "@/src/core/theme";
import { sortOptions } from "@/src/shared/utils/sortOptions";
import { useDismissFieldReview } from "./FieldReviewContext";
import { FormField } from "./FormField";
import { dropdownListStyle, dropdownPlacement } from "./dropdownPlacement";
import { useFieldSurface } from "./fieldSurface";

export type DropdownItem<T extends string | number | null = string> = {
  label: string;
  value: T;
  /** Sentinel rows ("All owners", "Unassigned", "+ Create new") stay above the sorted options. */
  pinned?: boolean;
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
  /** RHF field name, set only when this dropdown should participate in document-scan review. */
  reviewName?: string;
  /**
   * Options are ordered alphabetically in the active language by default. Set false where the
   * given order carries meaning (payment method/frequency, lease rule modes, periods).
   */
  sorted?: boolean;
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
  reviewName,
  sorted = true,
}: DropdownFieldProps<T>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl, language } = useLanguageContext();
  const items = useMemo(
    () => (sorted ? sortOptions(data, language) : data),
    [data, sorted, language],
  );
  const dismissReview = useDismissFieldReview();
  const surface = useFieldSurface({ error: !!error, disabled });

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

  const resolvedPlaceholder =
    placeholder ??
    (label ? t("common.selectNamed", { name: label }) : t("common.selectItem"));
  // The library gives the field and its list no accessible name unless it is passed one, and
  // without it the options are not exposed to VoiceOver at all: the open list read "undefined
  // flatlist". The label replaces the field's visible text, so the chosen value goes in too.
  const a11yName = label ?? resolvedPlaceholder;
  const selectedLabel = items.find((item) => item.value === value)?.label;

  return (
    <FormField
      label={label}
      required={required}
      error={error}
      reviewName={reviewName}
      style={inputStyle}
    >
      <View style={{ direction: "ltr" }}>
      <Dropdown
        data={items}
        labelField="label"
        valueField="value"
        value={value}
        placeholder={resolvedPlaceholder}
        accessibilityLabel={selectedLabel ? `${a11yName}, ${selectedLabel}` : a11yName}
        flatListProps={{ accessibilityLabel: a11yName }}
        disable={disabled}
        autoScroll={false}
        {...dropdownPlacement}
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
        style={surface}
        containerStyle={[
          styles.dropdownContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.outline,
          },
          dropdownListStyle,
        ]}
        onChange={(item: DropdownItem<T>) => {
          onChange(item.value);
          if (reviewName) dismissReview?.(reviewName);
        }}
        renderItem={renderItem}
      />
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
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
