import { Icon } from "@/src/shared/components/ui";
import React, { useCallback, useMemo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { TextInput, useTheme } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useLanguageContext, useRtlInputStyle } from "@/src/core/context";
import { darkColors, lightColors, radii, spacing } from "@/src/core/theme";

/** Same folding as the library's own search: case, whitespace and accents are ignored. */
const fold = (s: string) =>
  s.toLowerCase().replace(/\s/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Turns a react-native-element-dropdown list into the searchable version used for options
 * that come from the user's own data (properties, renters, suppliers, owners, categories) and
 * for the long currency list. Fixed short lists keep the plain dropdown.
 *
 * The list opens centred over a dim backdrop on both platforms. The anchored list Android
 * uses elsewhere (see dropdownPlacement) measures the field before the form scrolls for the
 * keyboard, so it stays under the keyboard and hides the results being searched.
 *
 * Spread `props` into the Dropdown / MultiSelect and add `listStyle` to its `containerStyle`.
 * With `enabled` false both are empty and the field keeps its usual placement.
 */
export function useDropdownSearch(
  items: { label: string; pinned?: boolean }[],
  enabled = true,
) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const rtlInputStyle = useRtlInputStyle();
  const placeholder = t("common.search");

  // Pinned rows ("No supplier", "Create new property") are actions, not matches: they stay
  // in the list whatever is typed.
  const pinnedLabels = useMemo(
    () => new Set(items.filter((i) => i.pinned).map((i) => i.label)),
    [items],
  );
  const searchQuery = useCallback(
    (keyword: string, label: string) =>
      pinnedLabels.has(label) || fold(label).includes(fold(keyword)),
    [pinnedLabels],
  );

  const searchIcon = useMemo(
    () => (
      <TextInput.Icon icon={() => <Icon name="search" size={18} color={colors.placeholder} />} />
    ),
    [colors.placeholder],
  );

  // Uncontrolled, so the field is empty again every time the list opens.
  const renderInputSearch = useCallback(
    (onSearch: (text: string) => void) => (
      <View style={styles.searchWrapper}>
        <TextInput
          onChangeText={onSearch}
          placeholder={placeholder}
          accessibilityLabel={placeholder}
          mode="outlined"
          dense
          // The library forces its list LTR, so the leading side is picked by hand.
          {...{ [isRtl ? "right" : "left"]: searchIcon }}
          style={[styles.searchInput, { backgroundColor: colors.controlFill }]}
          contentStyle={[rtlInputStyle, { textAlign: isRtl ? "right" : "left" }]}
          outlineColor="transparent"
          activeOutlineColor={colors.primary}
          outlineStyle={{ borderRadius: radii.md }}
          textColor={colors.textPrimary}
          placeholderTextColor={colors.placeholder}
          autoCorrect={false}
        />
      </View>
    ),
    [placeholder, searchIcon, colors.controlFill, colors.primary, colors.placeholder,
      colors.textPrimary, isRtl, rtlInputStyle],
  );

  if (!enabled) return { props: {}, listStyle: undefined };
  return {
    props: {
      mode: "modal" as const,
      backgroundColor: MODAL_BACKDROP,
      search: true,
      searchQuery,
      renderInputSearch,
    },
    listStyle: styles.modalList as ViewStyle,
  };
}

const MODAL_BACKDROP = "rgba(0,0,0,0.45)";

const styles = StyleSheet.create({
  searchWrapper: {
    padding: spacing.sm,
  },
  searchInput: {
    fontSize: 14,
  },
  // "modal" mode drops the library's `maxHeight`, so a long list would fill the screen.
  modalList: {
    maxHeight: "70%",
  },
});
