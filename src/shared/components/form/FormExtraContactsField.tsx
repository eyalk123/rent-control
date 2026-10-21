import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  useFieldArray,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { IconButton, Text, useTheme } from "react-native-paper";
import type { TFunction } from "i18next";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { Icon } from "@/src/shared/components/ui";
import { FormField } from "./FormField";
import { useAlert } from "@/src/core/context";
import { FormTextField } from "./FormFields";
import { FormNumericField } from "./FormFields";

type FormExtraContactsFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  t: TFunction;
  onPickContact: () => Promise<{ name: string; phone: string } | null>;
};

function FormExtraContactsFieldInner<TFieldValues extends FieldValues>({
  control,
  name,
  t,
  onPickContact,
}: FormExtraContactsFieldProps<TFieldValues>) {
  const theme = useTheme();
  const { appAlert } = useAlert();
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as any,
  });

  const handleAdd = React.useCallback(() => {
    appAlert(
      t("renter.extraContactAddTitle"),
      undefined,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("renter.extraContactEnterManually"),
          onPress: () => append({ name: "", phone: "" } as any),
        },
        {
          text: t("renter.extraContactPickFromContacts"),
          onPress: async () => {
            const picked = await onPickContact();
            if (picked) {
              append({ name: picked.name, phone: picked.phone } as any);
            }
          },
        },
      ],
    );
  }, [t, append, onPickContact, appAlert]);

  const colors = theme.dark ? darkColors : lightColors;

  // A field like the others - label above, contacts as name/phone pairs - with a dashed
  // input-sized "Add contact" box, the same empty state as the photo fields. It used to be
  // a filled grey panel with a lone "+", unlike anything else in the form.
  return (
    <FormField label={t("renter.extraContacts")}>

      {fields.map((field, index) => (
        <View key={field.id} style={styles.row}>
          <View style={styles.rowInputs}>
            <View style={styles.rowInput}>
              <FormTextField
                control={control}
                name={`${name}.${index}.name` as Path<TFieldValues>}
                label={t("renter.extraContactName")}
              />
            </View>
            <View style={styles.rowInput}>
              <FormNumericField
                control={control}
                name={`${name}.${index}.phone` as Path<TFieldValues>}
                label={t("renter.extraContactPhone")}
                keyboardType="phone-pad"
              />
            </View>
          </View>
          <IconButton
            icon="close"
            size={18}
            onPress={() => remove(index)}
            style={styles.removeButton}
          />
        </View>
      ))}
      <Pressable
        onPress={handleAdd}
        accessibilityRole="button"
        style={[styles.addBox, { borderColor: colors.inputBorder }]}
      >
        <Icon name="plus" size={20} color={colors.textSecondary} />
        <Text style={[styles.addText, { color: colors.textPrimary }]}>
          {t("renter.extraContactAddTitle")}
        </Text>
      </Pressable>
    </FormField>
  );
}

export const FormExtraContactsField = React.memo(
  FormExtraContactsFieldInner,
) as typeof FormExtraContactsFieldInner;

const styles = StyleSheet.create({
  // Same box as FormSingleFileField's empty photo state.
  addBox: {
    minHeight: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: 14,
  },
  addText: {
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  rowInputs: {
    flex: 1,
    flexDirection: "row",
    columnGap: spacing.sm,
  },
  rowInput: {
    flex: 1,
  },
  removeButton: {
    margin: 0,
    marginTop: spacing.sm,
  },
});
