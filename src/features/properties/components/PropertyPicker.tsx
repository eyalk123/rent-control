import React, { useMemo } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { useAccessibleProperties } from "@/src/features/properties/context/PropertyContext";
import { DropdownField } from "@/src/shared/components/form";
import { formatFloorApartment } from "@/src/shared/utils/propertyAddress";
import { PropertyThumb } from "@/src/features/properties/components/PropertyThumb";

interface PropertyPickerProps {
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  required?: boolean;
  inputStyle?: StyleProp<ViewStyle>;
  error?: { message?: string };
}

export function PropertyPicker({
  value,
  onChange,
  label,
  required,
  inputStyle,
  error,
}: PropertyPickerProps) {
  const { t } = useTranslation();
  const { properties } = useAccessibleProperties();

  const data = useMemo(
    () => [
      { label: t("renter.unassigned"), value: null as number | null, pinned: true },
      ...properties.map((p) => ({
        label: `${p.address}${formatFloorApartment(p, t)} - ${p.city}`,
        value: p.id as number,
      })),
    ],
    [properties, t],
  );
  // The chosen property's picture on its color, so the field shows which home it is at a glance.
  const selected = value != null ? properties.find((p) => p.id === value) : undefined;

  return (
    <DropdownField
      searchable
      required={required}
      data={data}
      value={value}
      onChange={onChange}
      label={label ?? t("renter.property")}
      placeholder={t("renter.unassigned")}
      error={error}
      inputStyle={inputStyle}
      leading={selected ? <PropertyThumb property={selected} width={52} height={36} radius={6} iconSize={18} /> : undefined}
    />
  );
}
