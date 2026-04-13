import React, { useMemo } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { useRenterContext } from "@/src/context";
import { DropdownField } from "@/src/shared/components/form";

interface RenterPickerProps {
  propertyId: number | null;
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
  allowNone?: boolean;
  error?: { message?: string };
}

export function RenterPicker({
  propertyId,
  value,
  onChange,
  label,
  inputStyle,
  allowNone = true,
  error,
}: RenterPickerProps) {
  const { t } = useTranslation();
  const { renters } = useRenterContext();

  const data = useMemo<{ label: string; value: number | null }[]>(() => {
    const filtered = renters.filter(
      (r) => propertyId == null || r.property_id === propertyId,
    );
    const items = filtered.map((r) => ({
      label: `${r.first_name} ${r.last_name}`,
      value: r.id as number,
    }));
    return allowNone
      ? [{ label: t("renter.unassigned"), value: null }, ...items]
      : items;
  }, [allowNone, propertyId, renters, t]);

  return (
    <DropdownField
      data={data}
      value={value}
      onChange={onChange}
      label={label ?? t("renter.property")}
      placeholder={allowNone ? t("renter.unassigned") : undefined}
      error={error}
      inputStyle={inputStyle}
    />
  );
}
