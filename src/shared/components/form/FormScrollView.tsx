import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { spacing } from "@/src/core/theme";
import { TourScrollerProvider } from "@/src/features/onboarding/AnchorRegistry";
import { useTourScrollHost } from "@/src/features/onboarding/TourScrollView";

type FormScrollViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  bounces?: boolean;
  /**
   * Jumps back to the top whenever this changes. Multi-page forms pass their page, because
   * every page renders inside this one scroll view and would otherwise open at whatever
   * offset the previous page was left at.
   */
  resetScrollKey?: unknown;
};

/**
 * Shared scroll wrapper for form screens.
 * Wraps KeyboardAwareScrollView with common defaults.
 *
 * Also the scroll host for onboarding: every form tour points at fields further down the
 * page than the fold, and registering here once covers all of them rather than each form
 * remembering to opt in. See features/onboarding/TourScrollView.
 */
export function FormScrollView({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  bounces = false,
  resetScrollKey,
}: FormScrollViewProps) {
  const { scroller, ref, scrollProps } = useTourScrollHost();

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof node.scrollToPosition === "function") node.scrollToPosition(0, 0, false);
    else node.scrollTo?.({ x: 0, y: 0, animated: false });
  }, [resetScrollKey, ref]);

  return (
    <KeyboardAwareScrollView
      {...scrollProps}
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      bounces={bounces}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={spacing.keyboardExtraScrollHeight}
    >
      <TourScrollerProvider value={scroller}>{children}</TourScrollerProvider>
    </KeyboardAwareScrollView>
  );
}
