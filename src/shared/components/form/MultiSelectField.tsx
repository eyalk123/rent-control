import { Icon } from "@/src/shared/components/ui";
import React, { useCallback, useMemo } from "react";
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
import { useLanguageContext, useRtlInputStyle } from "@/src/core/context";
import { darkColors, lightColors } from "@/src/core/theme";
import { sortOptions } from "@/src/shared/utils/sortOptions";
import type { DropdownItem } from "./DropdownField";
import { FormField } from "./FormField";
import { dropdownListStyle, dropdownPlacement } from "./dropdownPlacement";
import { useDropdownSearch } from "./dropdownSearch";
import { useFieldSurface } from "./fieldSurface";

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
  required?: boolean;
  /** Open as a centred list with a search box (see useDropdownSearch). */
  searchable?: boolean;
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
  required,
  searchable = false,
}: MultiSelectFieldProps<T>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl, language } = useLanguageContext();
  const surface = useFieldSurface({ error: !!error, disabled });

  const stringValue = useMemo(() => value.map((v) => String(v)), [value]);

  // Every item, alphabetically, the selected ones marked with a check so the open list shows
  // what is already chosen. Select All goes on top while anything is left to add. It is not
  // `pinned`, so a search hides it: it would select everything, not just the matches.
  const options = useMemo(() => {
    const all = sortOptions(
      data.map((item) => ({ label: item.label, value: String(item.value) })),
      language,
    );
    if (all.every((item) => stringValue.includes(item.value))) return all;
    return [
      {
        label: t("common.selectAll", { defaultValue: "Select All" }),
        value: SELECT_ALL_VALUE,
      },
      ...all,
    ];
  }, [data, stringValue, t, language]);
  const search = useDropdownSearch(options, searchable);

  const selectedItems = useMemo(
    () => sortOptions(data.filter((item) => stringValue.includes(String(item.value))), language),
    [data, stringValue, language],
  );

  // The library hands back the whole selection with the tapped row toggled.
  const handleChange = (strings: string[]) => {
    if (strings.includes(SELECT_ALL_VALUE)) {
      onChange(data.map((d) => d.value));
      return;
    }
    onChange(
      data
        .filter((item) => strings.includes(String(item.value)))
        .map((item) => item.value),
    );
  };

  const handleUnselect = (strVal: string) => {
    onChange(value.filter((v) => String(v) !== strVal));
  };

  const renderItem = useCallback(
    (item: { label: string; value: string }, selected?: boolean) => {
      const isSelectAll = item.value === SELECT_ALL_VALUE;
      return (
        <View
          accessibilityState={isSelectAll ? undefined : { selected: !!selected }}
          style={[
            styles.itemContainer,
            // The wrapper is forced LTR for the library, so RTL is laid out by hand here.
            { flexDirection: isRtl ? "row-reverse" : "row" },
            // A selected row shows the library's `activeColor` behind it.
            { backgroundColor: selected ? "transparent" : colors.surface },
          ]}
        >
          <Text
            style={[
              styles.itemText,
              rtlInputStyle,
              {
                textAlign: isRtl ? "right" : "left",
                color: isSelectAll ? colors.primary : colors.textPrimary,
                fontWeight: isSelectAll || selected ? "600" : "400",
              },
            ]}
          >
            {item.label}
          </Text>
          {selected ? <Icon name="check" size={18} color={colors.primary} /> : null}
        </View>
      );
    },
    [colors.surface, colors.primary, colors.textPrimary, isRtl, rtlInputStyle],
  );

  const resolvedPlaceholder =
    placeholder ??
    (label ? t("common.selectNamed", { name: label }) : t("common.selectItem"));
  // Without a name the library hides the options from VoiceOver (see DropdownField).
  const a11yName = label ?? resolvedPlaceholder;

  return (
    <FormField label={label} required={required} error={error} style={inputStyle}>
      <View style={{ direction: "ltr" }}>
        <MultiSelect
          data={options}
          labelField="label"
          valueField="value"
          value={stringValue}
          placeholder={resolvedPlaceholder}
          accessibilityLabel={a11yName}
          flatListProps={{ accessibilityLabel: a11yName }}
          disable={disabled}
          {...dropdownPlacement}
          {...search.props}
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
            search.listStyle,
          ]}
          activeColor={colors.inputFilledBackground}
          onChange={handleChange}
          renderItem={renderItem}
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
          {/* Chips follow the same alphabetical order as the list, not selection order. */}
          {selectedItems.map((item) => (
            <Chip
              key={String(item.value)}
              mode="outlined"
              onClose={() => handleUnselect(String(item.value))}
              style={styles.chip}
              textStyle={{ color: colors.textPrimary }}
            >
              {item.label}
            </Chip>
          ))}
        </ScrollView>
      ) : null}

    </FormField>
  );
}

const CHIP_ROW_HEIGHT = 36;
const CHIP_GAP = 6;
const MAX_CHIP_ROWS = 3;

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
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemText: {
    flex: 1,
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
    borderRadius: 999,
  },
});
