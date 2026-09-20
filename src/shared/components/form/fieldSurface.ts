import { StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";
import { darkColors, lightColors } from "@/src/core/theme";

type FieldSurfaceState = {
  focused?: boolean;
  error?: boolean;
  disabled?: boolean;
};

/**
 * The box every form control draws itself in.
 *
 * Before this existed each control hard-coded its own copy — same four properties, eleven
 * times, and they had already drifted (radius 4 in most, 20 in two, minHeight 40 in the date
 * fields against 48 elsewhere). One source means one shape.
 *
 * Unfilled on purpose. Filled-with-a-faint-border was the hybrid that made a blank form read
 * as a stack of grey slabs: the fill was 1.11:1 against the card it sat on and the border
 * 1.33:1, so neither one actually drew the edge. The outline carries it alone now, at 3:1.
 */
export function useFieldSurface(state: FieldSurfaceState = {}): ViewStyle {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { focused, error, disabled } = state;

  return {
    ...styles.base,
    backgroundColor: "transparent",
    borderColor: error
      ? colors.error
      : focused
        ? colors.inputBorderFocus
        : colors.inputBorder,
    opacity: disabled ? 0.6 : 1,
  };
}

/**
 * Focus is a colour change, not a width change. Growing the border from 1 to 2 nudged every
 * character in the field over by a pixel on focus, because React Native draws a border inside
 * the box. The ring is carried by `inputBorderFocus`, plus a shadow on iOS.
 *
 * **No `elevation` here, and this is the one place that departs from MOBILE-DESIGN.md §6's
 * "always pair a shadow with an Android elevation" rule.** The field is deliberately
 * unfilled (see `useFieldSurface`), and Android draws an elevation shadow *behind* the
 * view — with nothing opaque in front of it the shadow shows straight through the box.
 * Focusing a field therefore filled it with a grey slab and left only the editable text
 * line white: not a focus ring, a rendering artefact. The rule assumes an opaque surface;
 * an unfilled one cannot cast an Android shadow at all, so the honest version is not to
 * try. `inputBorderFocus` carries the state on its own at 11.5:1 light.
 */
export function useFieldFocusShadow(): ViewStyle {
  const theme = useTheme();
  // Navy on cream per MOBILE-DESIGN.md §6; a navy shadow is invisible on the dark palette.
  return {
    shadowColor: theme.dark ? "#000" : lightColors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: theme.dark ? 0.3 : 0.16,
    shadowRadius: 4,
  };
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    // 12 is the card/button radius. A near-square radius-4 box inside a radius-16 card was
    // the single most dated shape in the app. See MOBILE-DESIGN.md §4.
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    // Hard floor from MOBILE-DESIGN.md §5. The date fields were at 40.
    minHeight: 48,
    justifyContent: "center",
  },
});

/** Plain (non-hook) copy of the box metrics, for StyleSheet definitions that need them. */
export const fieldSurfaceMetrics = styles.base;
