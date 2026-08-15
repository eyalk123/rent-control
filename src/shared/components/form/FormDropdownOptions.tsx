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
  /** Sentinel rows stay above the sorted options. */
  pinned?: boolean;
};

type FormDropdownOptionsProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  /** See DropdownField: false keeps a meaningful given order. */
  sorted?: boolean;
};

export function FormDropdownOptions<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  required,
  sorted,
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
          sorted={sorted}
          reviewName={name}
        />
      )}
    />
  );
}
