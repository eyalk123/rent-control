import {
  useLanguageContext,
  useRtlInputStyle,
  useRtlLabelStyle,
} from "@/src/context";
import { getApiErrorMessage } from "@/src/core/api/client";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { createExpenseCategory } from "@/src/features/transactions/api/transactions";
import { useExpenseCategories } from "@/src/features/transactions/hooks/useTransactions";
import { getCategoryDisplayName } from "@/src/features/transactions/utils/categoryUtils";
import type { ExpenseCategory } from "@/src/shared/types";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import {
  Button,
  Chip,
  Dialog,
  Menu,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

const DROPDOWN_MAX_HEIGHT = Math.min(
  280,
  Dimensions.get("window").height * 0.4,
);

interface CategoryTagPickerProps {
  value: number[];
  onChange: (ids: number[]) => void;
  label?: string;
  inputStyle?: StyleProp<ViewStyle>;
}

export function CategoryTagPicker({
  value,
  onChange,
  label,
  inputStyle,
}: CategoryTagPickerProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const rtlInputStyle = useRtlInputStyle();
  const rtlLabelStyle = useRtlLabelStyle();
  
  /** Chip label text (narrow box is OK). */
  const rtlChipTextStyle: TextStyle | undefined = isRtl
    ? { textAlign: "right", writingDirection: "rtl" }
    : undefined;
    
  /**
   * Menu.Item title is shrink-wrapped by default, so `textAlign` has no visible effect in a wide row.
   * Let the title area grow (react-native-paper MenuItem `contentStyle`) and stretch the Text — same
   * idea as dropdown rows using `width: '100%'` in FormDropdownOptions / PropertyPicker.
   */
  const rtlMenuItemContentStyle: ViewStyle | undefined = isRtl
    ? { flex: 1, minWidth: 0 }
    : undefined;
  const rtlMenuItemTitleStyle: TextStyle | undefined = isRtl
    ? {
        textAlign: "right",
        writingDirection: "rtl",
        width: "100%",
      }
    : undefined;
    
  const { categories, loading, refreshCategories } = useExpenseCategories();
  const [menuVisible, setMenuVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedCategories = value
    .map((id) => categories.find((c) => c.id === id))
    .filter((c): c is ExpenseCategory => c != null);
  const availableToAdd = categories.filter((c) => !value.includes(c.id));

  const handleRemove = (id: number) => {
    onChange(value.filter((cid) => cid !== id));
  };

  const handleAdd = (id: number) => {
    if (!value.includes(id)) {
      onChange([...value, id]);
    }
    setMenuVisible(false);
  };

  const handleCreateCategory = async () => {
    const trimmed = createName.trim();
    if (!trimmed || createLoading) return;

    setCreateLoading(true);
    setCreateError(null);
    try {
      const created = await createExpenseCategory(trimmed);
      await refreshCategories();
      onChange([...value, created.id]);
      setCreateName("");
      setCreateModalVisible(false);
      setMenuVisible(false);
    } catch (err) {
      setCreateError(getApiErrorMessage(err, t('error.createCategoryFailed')));
    } finally {
      setCreateLoading(false);
    }
  };

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => {
    setMenuVisible(false);
    setCreateModalVisible(false);
    setCreateName("");
    setCreateError(null);
  };

  const showCreateModal = () => {
    setMenuVisible(false);
    setCreateModalVisible(true);
  };

  return (
    <View style={[styles.container, inputStyle]}>
      {label ? (
        <Text
          variant="bodyMedium"
          style={[styles.label, rtlLabelStyle]}
          numberOfLines={1}
        >
          {label}
        </Text>
      ) : null}

      <View style={styles.chipsRow}>
        {/* Render the Add Category button FIRST */}
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Chip
              mode="flat"
              compact
              icon="plus"
              onPress={openMenu}
              style={[
                styles.chip,
                { 
                  backgroundColor: colors.primary,
                  direction: isRtl ? "rtl" : "ltr"
                }
              ]}
              textStyle={[
                styles.chipText,
                rtlChipTextStyle,
                { color: colors.onPrimary, fontWeight: "600" },
                isRtl && { marginLeft: 8, marginRight: 4 }
              ]}
              theme={{
                colors: {
                  onSurfaceVariant: colors.onPrimary,
                  primary: colors.onPrimary
                }
              }}
            >
              {t("suppliers.addCategory", { defaultValue: "Add category" })}
            </Chip>
          }
          anchorPosition="bottom"
          contentStyle={[
            styles.menuContent,
            { backgroundColor: colors.surface },
          ]}
        >
          <ScrollView
            style={styles.menuScrollView}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {availableToAdd.map((cat) => (
              <Menu.Item
                key={cat.id}
                onPress={() => handleAdd(cat.id)}
                title={getCategoryDisplayName(cat, t)}
                contentStyle={rtlMenuItemContentStyle}
                titleStyle={rtlMenuItemTitleStyle}
              />
            ))}
            <Menu.Item
              onPress={showCreateModal}
              title={t("suppliers.createNewCategory", {
                defaultValue: "Create new category...",
              })}
              leadingIcon="plus"
              contentStyle={rtlMenuItemContentStyle}
              titleStyle={rtlMenuItemTitleStyle}
            />
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" />
              </View>
            ) : null}
          </ScrollView>
        </Menu>

        {/* Selected categories */}
        {selectedCategories.map((cat) => (
          <Chip
            key={cat.id}
            mode="outlined"
            compact
            onClose={() => handleRemove(cat.id)}
            style={[styles.chip, { direction: isRtl ? "rtl" : "ltr" }]}
            textStyle={[styles.chipText, rtlChipTextStyle]}
          >
            {getCategoryDisplayName(cat, t)}
          </Chip>
        ))}

        <Portal>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoidingView}
            pointerEvents="box-none"
          >
            <Dialog
              visible={createModalVisible}
              onDismiss={() => {
                setCreateModalVisible(false);
                setCreateName("");
                setCreateError(null);
              }}
              style={[
                styles.dialog, 
                { backgroundColor: theme.dark ? darkColors.surfaceElevated : lightColors.surface }
              ]}
            >
              <Dialog.Title 
                style={[
                  styles.dialogTitle, 
                  { 
                    textAlign: isRtl ? "right" : "left", 
                    color: colors.textPrimary 
                  }
                ]}
              >
                {t("suppliers.createCategoryTitle", {
                  defaultValue: "Create new category",
                })}
              </Dialog.Title>
              <Dialog.Content>
                <TextInput
                  value={createName}
                  onChangeText={setCreateName}
                  placeholder={t("suppliers.createCategory", {
                    defaultValue: "Category name",
                  })}
                  mode="outlined"
                  dense
                  style={[
                    styles.dialogInput, 
                    rtlInputStyle, 
                    { backgroundColor: theme.dark ? darkColors.inputFilledBackground : lightColors.inputBackground }
                  ]}
                  contentStyle={rtlInputStyle}
                  textColor={colors.textPrimary}
                  autoFocus
                  editable={!createLoading}
                />
                {createError ? (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {createError}
                  </Text>
                ) : null}
              </Dialog.Content>
              <Dialog.Actions style={styles.dialogActions}>
                <Button
                  onPress={() => {
                    setCreateModalVisible(false);
                    setCreateName("");
                    setCreateError(null);
                  }}
                  textColor={colors.textSecondary}
                >
                  {t("common.cancel", { defaultValue: "Cancel" })}
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateCategory}
                  loading={createLoading}
                  disabled={!createName.trim() || createLoading}
                  style={isRtl ? { marginRight: spacing.sm } : { marginLeft: spacing.sm }}
                >
                  {t("common.create", { defaultValue: "Create" })}
                </Button>
              </Dialog.Actions>
            </Dialog>
          </KeyboardAvoidingView>
        </Portal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: "500",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm, 
  },
  chip: {
  },
  chipText: {
    fontSize: 14,
  },
  menuContent: {
    minWidth: 200,
    paddingVertical: spacing.xs,
  },
  menuScrollView: {
    maxHeight: DROPDOWN_MAX_HEIGHT,
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
  errorText: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  loadingRow: {
    padding: spacing.sm,
  },
});