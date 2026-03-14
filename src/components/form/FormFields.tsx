import React from "react";
import type { FieldValues, Path, Control } from "react-hook-form";
import type { TextInput as RNTextInput } from "react-native";
import { FormInput } from "@/src/components/form/FormInput";
import { useRtlPlaceholder } from "@/src/context";

type CommonFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  placeholder?: string;
};

export function FormTextField<TFieldValues extends FieldValues>(
  props: CommonFieldProps<TFieldValues>,
) {
  return <FormInput {...props} />;
}

export function FormNumericField<TFieldValues extends FieldValues>(
  props: CommonFieldProps<TFieldValues> & {
    keyboardType?: React.ComponentProps<typeof RNTextInput>["keyboardType"];
  },
) {
  const { keyboardType = "numeric", ...rest } = props;
  return <FormInput {...rest} keyboardType={keyboardType} />;
}

export function FormDateField<TFieldValues extends FieldValues>(
  props: CommonFieldProps<TFieldValues>,
) {
  const rtlPlaceholder = useRtlPlaceholder();

  return (
    <FormInput
      {...props}
      keyboardType="numeric"
      placeholder={
        props.placeholder
          ? rtlPlaceholder(props.placeholder)
          : rtlPlaceholder("YYYY-MM-DD")
      }
    />
  );
}

