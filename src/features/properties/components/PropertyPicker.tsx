import React, { useMemo } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { usePropertyContext } from "@/src/context";
import { DropdownField } from "@/src/shared/components/form";

interface PropertyPickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
  error?: { message?: string };
}

export function PropertyPicker({
  value,
  onChange,
  label,
  inputStyle,
  error,
}: PropertyPickerProps) {
  const { t } = useTranslation();
  const { properties } = usePropertyContext();

  const data = useMemo(
    () => [
      { label: t("renter.unassigned"), value: null as number | null },
      ...properties.map((p) => ({
        label: `${p.address} - ${p.city}`,
        value: p.id as number,
      })),
    ],
    [properties, t],
  );

  return (
    <DropdownField
      data={data}
      value={value}
      onChange={onChange}
      label={label ?? t("renter.property")}
      placeholder={t("renter.unassigned")}
      error={error}
      inputStyle={inputStyle}
    />
  );
}
