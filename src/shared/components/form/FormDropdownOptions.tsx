import React from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { DropdownField } from "./DropdownField";

type Option = {
  label: string;
  value: string;
};

type FormDropdownOptionsProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  options: Option[];
  placeholder?: string;
  required?: boolean;
};

export function FormDropdownOptions<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  required,
}: FormDropdownOptionsProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <DropdownField
          data={options}
          value={(value as string) ?? null}
          onChange={onChange}
          label={label}
          placeholder={placeholder}
          error={error}
          required={required}
          reviewName={name}
        />
      )}
    />
  );
}
