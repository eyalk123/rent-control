import {
  useLanguageContext,
  useRtlInputStyle,
} from "@/src/core/context";
import { darkColors, lightColors } from "@/src/core/theme";
import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  Pressable,
  StyleSheet,
  View,
  TextInput as RNTextInput,
} from "react-native";
import { useTheme } from "react-native-paper";
import { FormField } from "./FormField";
import { useFieldFocusShadow, useFieldSurface } from "./fieldSurface";
import { useDismissFieldReview, useFieldReview } from "./FieldReviewContext";

type FormInputProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
  keyboardType?: React.ComponentProps<typeof RNTextInput>["keyboardType"];
  multiline?: boolean;
  dense?: boolean;
  required?: boolean;
};

function FormInputInner<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  multiline,
  required,
}: FormInputProps<TFieldValues>) {
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl } = useLanguageContext();
  const inputRef = React.useRef<RNTextInput>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const review = useFieldReview(name);
  const dismissReview = useDismissFieldReview();

  return (
    <Controller
      control={control}
      name={name}
      render={({
        field: { value, onChange, onBlur, ref: rhfRef },
        fieldState: { error },
      }) => {
        const handleChange = (text: string) => {
          onChange(text);
          if (review) dismissReview?.(name);
        };
        return (
          <FormField label={label} required={required} error={error} reviewName={name}>
            <View>
              <FieldBox
                inputRef={inputRef}
                rhfRef={rhfRef}
                value={value as string}
                onChangeText={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  setIsFocused(false);
                  onBlur();
                }}
                focused={isFocused}
                hasError={!!error}
                keyboardType={keyboardType}
                multiline={multiline}
                placeholder={placeholder}
                placeholderColor={colors.placeholder}
                textColor={colors.textPrimary}
                isRtl={isRtl}
                rtlInputStyle={rtlInputStyle}
              />
              {!isFocused && (
                <Pressable
                  style={StyleSheet.absoluteFill}
                  onPress={() => inputRef.current?.focus()}
                />
              )}
            </View>
          </FormField>
        );
      }}
    />
  );
}

/** Split out so the surface hooks are not called inside a render prop. */
function FieldBox({
  inputRef,
  rhfRef,
  focused,
  hasError,
  placeholderColor,
  textColor,
  isRtl,
  rtlInputStyle,
  ...rest
}: {
  inputRef: React.RefObject<RNTextInput | null>;
  /** RHF's own ref, so `setFocus(name)` can reach this input. */
  rhfRef: (instance: unknown) => void;
  focused: boolean;
  hasError: boolean;
  placeholderColor: string;
  textColor: string;
  isRtl: boolean;
  rtlInputStyle: object;
} & React.ComponentProps<typeof RNTextInput>) {
  const surface = useFieldSurface({ focused, error: hasError });
  const focusShadow = useFieldFocusShadow();

  return (
    <RNTextInput
      ref={(el) => {
        inputRef.current = el;
        rhfRef?.(el);
      }}
      textAlignVertical={rest.multiline ? "top" : "center"}
      placeholderTextColor={placeholderColor}
      textAlign={isRtl ? "right" : "left"}
      // Disable OS autofill / keyboard strong-password + contact suggestions on all
      // property/renter/transaction fields (values must not leak between forms).
      autoComplete="off"
      autoCorrect={false}
      importantForAutofill="no"
      textContentType="none"
      {...rest}
      style={[
        surface,
        styles.text,
        { color: textColor },
        rest.multiline && styles.multiline,
        focused && focusShadow,
        rtlInputStyle,
      ]}
    />
  );
}

export const FormInput = React.memo(FormInputInner) as typeof FormInputInner;

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    justifyContent: "flex-start",
  },
});
