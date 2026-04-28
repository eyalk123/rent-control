import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Chip, Text, useTheme } from "react-native-paper";
import { MultiSelect } from "react-native-element-dropdown";
import { useTranslation } from "react-i18next";
import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
} from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import type { DropdownItem } from "./DropdownField";

const SELECT_ALL_VALUE = "__select_all__";

interface MultiSelectFieldProps<T extends string | number> {
  data: DropdownItem<T>[];
  value: T[];
  onChange: (values: T[]) => void;
  label?: string;
  placeholder?: string;
  error?: { message?: string };
  disabled?: boolean;
  inputStyle?: StyleProp<ViewStyle>;
}

export function MultiSelectField<T extends string | number>({
  data,
  value,
  onChange,
  label,
  placeholder,
  error,
  disabled = false,
  inputStyle,
}: MultiSelectFieldProps<T>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const rtlLabelStyle = useRtlLabelStyle();
  const { isRtl } = useLanguageContext();

  const stringValue = useMemo(() => value.map((v) => String(v)), [value]);

  // Only show unselected items; prepend Select All when there are items to add
  const availableData = useMemo(() => {
    const unselected = data
      .filter((item) => !stringValue.includes(String(item.value)))
      .map((item) => ({ label: item.label, value: String(item.value) }));
    if (unselected.length === 0) return [];
    return [
      { label: t("common.selectAll", { defaultValue: "Select All" }), value: SELECT_ALL_VALUE },
      ...unselected,
    ];
  }, [data, stringValue, t]);

  const handleChange = (strings: string[]) => {
    if (strings.includes(SELECT_ALL_VALUE)) {
      onChange(data.map((d) => d.value));
      return;
    }
    const newValues = data
      .filter((item) => strings.includes(String(item.value)))
      .map((item) => item.value);
    onChange([...value, ...newValues]);
  };

  const handleUnselect = (strVal: string) => {
    onChange(value.filter((v) => String(v) !== strVal));
  };

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
          {label}
        </Text>
      ) : null}

      <View style={{ direction: "ltr" }}>
        <MultiSelect
          data={availableData}
          labelField="label"
          valueField="value"
          value={[]}
          placeholder={placeholder ?? t("common.selectItem")}
          disable={disabled}
          renderRightIcon={isRtl ? () => null : undefined}
          renderLeftIcon={
            isRtl
              ? () => (
                  <MaterialCommunityIcons
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
                ? colors.inputBackground
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
          activeColor={colors.inputFilledBackground}
          onChange={handleChange}
          renderItem={(item) => (
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
                    color: item.value === SELECT_ALL_VALUE
                      ? colors.primary
                      : colors.textPrimary,
                    fontWeight: item.value === SELECT_ALL_VALUE ? "600" : "400",
                  },
                ]}
              >
                {item.label}
              </Text>
            </View>
          )}
          renderSelectedItem={() => null}
          visibleSelectedItem={false}
        />
      </View>

      {value.length > 0 ? (
        <ScrollView
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {value.map((v) => {
            const item = data.find((d) => d.value === v);
            if (!item) return null;
            return (
              <Chip
                key={String(v)}
                mode="outlined"
                onClose={() => handleUnselect(String(v))}
                style={styles.chip}
                textStyle={{ color: colors.textPrimary }}
              >
                {item.label}
              </Chip>
            );
          })}
        </ScrollView>
      ) : null}

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

const CHIP_ROW_HEIGHT = 36;
const CHIP_GAP = 6;
const MAX_CHIP_ROWS = 3;

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
  chipsScroll: {
    maxHeight: CHIP_ROW_HEIGHT * MAX_CHIP_ROWS + CHIP_GAP * (MAX_CHIP_ROWS - 1),
    marginTop: 8,
  },
  chipsContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CHIP_GAP,
  },
  chip: {
    borderRadius: 20,
  },
});
