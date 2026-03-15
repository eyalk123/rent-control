import React from "react";
import type { FieldValues, Path, Control } from "react-hook-form";
import { FormSectionCard } from "./FormSectionCard";
import { FormTextField, FormNumericField, FormDateField } from "./FormFields";

type FieldConfig<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  type: "text" | "number" | "date";
  required?: boolean;
};

type FormCardProps<TFieldValues extends FieldValues> = {
  title: string;
  control: Control<TFieldValues>;
  fields: FieldConfig<TFieldValues>[];
};

export function FormCard<TFieldValues extends FieldValues>({
  title,
  control,
  fields,
}: FormCardProps<TFieldValues>) {
  return (
    <FormSectionCard title={title}>
      {fields.map((field) => {
        const label = `${field.label}${field.required ? " *" : ""}`;
        switch (field.type) {
          case "number":
            return (
              <FormNumericField
                key={String(field.name)}
                control={control}
                name={field.name}
                label={label}
              />
            );
          case "date":
            return (
              <FormDateField
                key={String(field.name)}
                control={control}
                name={field.name}
                label={label}
              />
            );
          default:
            return (
              <FormTextField
                key={String(field.name)}
                control={control}
                name={field.name}
                label={label}
              />
            );
        }
      })}
    </FormSectionCard>
  );
}
