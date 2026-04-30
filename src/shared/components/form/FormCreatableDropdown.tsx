import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
} from "@/src/core/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { Icon } from "@/src/shared/components/ui";
import React, { useState } from "react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  Menu,
  Portal,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

const MENU_MAX_HEIGHT = 250;

type FormCreatableDropdownProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label: string;
  options: string[];
  placeholder?: string;
  createLabel: string;
  createModalTitle: string;
  createModalPlaceholder?: string;
};

export function FormCreatableDropdown<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder,
  createLabel,
  createModalTitle,
  createModalPlaceholder,
}: FormCreatableDropdownProps<TFieldValues>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const { isRtl } = useLanguageContext();
  const rtlLabelStyle = useRtlLabelStyle();

  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [anchorWidth, setAnchorWidth] = useState(0);

  const closeModal = () => {
    setModalVisible(false);
    setNewName("");
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => {
        const currentValue = value as string | undefined | null;

        const handleConfirm = () => {
          const trimmed = newName.trim();
          if (!trimmed) return;
          onChange(trimmed);
          closeModal();
        };

        return (
          <View style={styles.inputWrap}>
            <Text
              variant="bodyMedium"
              style={[
                styles.label,
                rtlLabelStyle,
                { color: error ? colors.error : colors.textPrimary },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>

            <View style={{ direction: "ltr" }}>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  <Pressable
                    onPress={() => setMenuVisible(true)}
                    onLayout={(e) => setAnchorWidth(e.nativeEvent.layout.width)}
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: colors.inputFilledBackground,
                        borderColor: error ? colors.error : colors.outline,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.valueText,
                        rtlInputStyle,
                        {
                          color: currentValue
                            ? colors.textPrimary
                            : colors.placeholder,
                          textAlign: isRtl ? "right" : "left",
                          flex: 1,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {currentValue || placeholder || ""}
                    </Text>
                    <View style={isRtl ? styles.iconRtl : styles.iconLtr}>
                      <Icon
                        name="chevron-down"
                        size={20}
                        color={colors.placeholder}
                      />
                    </View>
                  </Pressable>
                }
                anchorPosition="bottom"
                contentStyle={[
                  styles.menuContent,
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.outline,
                    width: anchorWidth,
                  },
                ]}
              >
                <ScrollView
                  style={styles.menuScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
                  {options.map((owner) => (
                    <TouchableRipple
                      key={owner}
                      onPress={() => {
                        onChange(owner);
                        setMenuVisible(false);
                      }}
                      style={[
                        styles.itemContainer,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Text
                        style={[
                          styles.itemText,
                          rtlInputStyle,
                          {
                            textAlign: isRtl ? "right" : "left",
                            width: "100%",
                            color: colors.textPrimary,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {owner}
                      </Text>
                    </TouchableRipple>
                  ))}
                  <TouchableRipple
                    onPress={() => {
                      setMenuVisible(false);
                      setModalVisible(true);
                    }}
                    style={[
                      styles.itemContainer,
                      styles.createItemContainer,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <View style={styles.createItemRow}>
                      <View style={isRtl ? styles.createIconRtl : styles.createIconLtr}>
                        <Icon
                          name="plus"
                          size={16}
                          color={colors.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.itemText,
                          rtlInputStyle,
                          { color: colors.primary, flex: 1, textAlign: isRtl ? "right" : "left" },
                        ]}
                      >
                        {createLabel}
                      </Text>
                    </View>
                  </TouchableRipple>
                </ScrollView>
              </Menu>
            </View>

            {error ? (
              <Text
                variant="bodySmall"
                style={[styles.errorText, { color: colors.error }]}
              >
                {error.message}
              </Text>
            ) : null}

            <Portal>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.keyboardAvoidingView}
                pointerEvents="box-none"
              >
                <Dialog
                  visible={modalVisible}
                  onDismiss={closeModal}
                  style={[
                    styles.dialog,
                    {
                      backgroundColor: theme.dark
                        ? darkColors.surfaceElevated
                        : lightColors.surface,
                    },
                  ]}
                >
                  <Dialog.Title
                    style={[
                      styles.dialogTitle,
                      {
                        textAlign: isRtl ? "right" : "left",
                        color: colors.textPrimary,
                      },
                    ]}
                  >
                    {createModalTitle}
                  </Dialog.Title>
                  <Dialog.Content>
                    <TextInput
                      value={newName}
                      onChangeText={setNewName}
                      placeholder={createModalPlaceholder}
                      mode="outlined"
                      dense
                      style={[
                        styles.dialogInput,
                        rtlInputStyle,
                        {
                          backgroundColor: theme.dark
                            ? darkColors.inputFilledBackground
                            : lightColors.inputBackground,
                        },
                      ]}
                      contentStyle={rtlInputStyle}
                      textColor={colors.textPrimary}
                      autoFocus
                      onSubmitEditing={handleConfirm}
                      returnKeyType="done"
                    />
                  </Dialog.Content>
                  <Dialog.Actions style={styles.dialogActions}>
                    <Button onPress={closeModal} textColor={colors.textSecondary}>
                      {t("common.cancel")}
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleConfirm}
                      disabled={!newName.trim()}
                      style={
                        isRtl
                          ? { marginRight: spacing.sm }
                          : { marginLeft: spacing.sm }
                      }
                    >
                      {t("common.add")}
                    </Button>
                  </Dialog.Actions>
                </Dialog>
              </KeyboardAvoidingView>
            </Portal>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: 4,
    fontWeight: "500",
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  valueText: {
    fontSize: 16,
  },
  iconLtr: {
    marginLeft: 4,
  },
  iconRtl: {
    marginRight: 4,
  },
  menuContent: {
    paddingVertical: 0,
    borderRadius: 4,
    overflow: "hidden",
  },
  menuScroll: {
    maxHeight: MENU_MAX_HEIGHT,
  },
  itemContainer: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  itemText: {
    fontSize: 16,
  },
  createItemContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  createItemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  createIconLtr: {
    marginRight: 6,
  },
  createIconRtl: {
    marginLeft: 6,
  },
  errorText: {
    marginTop: 4,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
  },
  dialog: {
    borderRadius: 16,
    marginBottom: 100,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  dialogInput: {
    marginTop: spacing.xs,
  },
  dialogActions: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
});
