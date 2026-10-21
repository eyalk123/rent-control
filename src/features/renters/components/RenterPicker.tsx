import React, { useMemo } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { useRenterContext } from "@/src/context";
import { DropdownField } from "@/src/shared/components/form";
import { useEntityColor } from "@/src/core/theme";
import { RenterAvatar } from "@/src/features/renters/components/RenterAvatar";

interface RenterPickerProps {
  propertyId: number | null;
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  required?: boolean;
  inputStyle?: StyleProp<ViewStyle>;
  allowNone?: boolean;
  disabled?: boolean;
  error?: { message?: string };
}

export function RenterPicker({
  propertyId,
  value,
  onChange,
  label,
  required,
  inputStyle,
  allowNone = true,
  disabled = false,
  error,
}: RenterPickerProps) {
  const { t } = useTranslation();
  const { renters } = useRenterContext();

  const data = useMemo<{ label: string; value: number | null; pinned?: boolean }[]>(() => {
    const filtered = renters.filter(
      (r) => propertyId == null || r.property_id === propertyId,
    );
    const items = filtered.map((r) => ({
      label: `${r.first_name} ${r.last_name}`,
      value: r.id as number,
    }));
    return allowNone
      ? [{ label: t("renter.unassigned"), value: null, pinned: true }, ...items]
      : items;
  }, [allowNone, propertyId, renters, t]);

  // The chosen renter's initials on their color, as the property picker shows its picture.
  const selected = value != null ? renters.find((r) => r.id === value) : undefined;
  const selectedColor = useEntityColor(selected?.color);

  return (
    <DropdownField
      searchable
      required={required}
      data={data}
      value={value}
      onChange={onChange}
      label={label ?? t("renter.property")}
      placeholder={allowNone ? t("renter.unassigned") : undefined}
      error={error}
      inputStyle={inputStyle}
      disabled={disabled}
      leading={
        selected ? (
          <RenterAvatar
            renter={selected}
            size={36}
            radius={10}
            backgroundColor={selectedColor.bg}
            textColor={selectedColor.fg}
          />
        ) : undefined
      }
    />
  );
}
