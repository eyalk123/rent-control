import React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { spacing } from "@/src/core/theme";

type FormScrollViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
  bounces?: boolean;
};

/**
 * Shared scroll wrapper for form screens.
 * Wraps KeyboardAwareScrollView with common defaults.
 */
export function FormScrollView({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  bounces = false,
}: FormScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      bounces={bounces}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={spacing.keyboardExtraScrollHeight}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}
