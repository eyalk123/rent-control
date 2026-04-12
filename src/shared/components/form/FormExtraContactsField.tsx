import React from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  useFieldArray,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { IconButton, Text, useTheme } from "react-native-paper";
import type { TFunction } from "i18next";
import { spacing } from "@/src/core/theme";
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
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as any,
  });

  const handleAdd = React.useCallback(() => {
    Alert.alert(
      t("renter.extraContactAddTitle"),
      undefined,
      [
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
        { text: t("common.cancel"), style: "cancel" },
      ],
    );
  }, [t, append, onPickContact]);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surfaceVariant,
        },
      ]}
    >
      <View style={styles.header}>
        <Text variant="bodyMedium" style={styles.headerLabel}>
          {t("renter.extraContacts")}
        </Text>
        <IconButton
          icon="plus"
          size={20}
          onPress={handleAdd}
          style={styles.addButton}
        />
      </View>

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
    </View>
  );
}

export const FormExtraContactsField = React.memo(
  FormExtraContactsFieldInner,
) as typeof FormExtraContactsFieldInner;

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  headerLabel: {
    fontWeight: "600",
  },
  addButton: {
    margin: 0,
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
