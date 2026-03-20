import { useLanguageContext } from "@/src/context";
import { getApiErrorMessage } from "@/src/core/api/client";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useContactPicker } from "@/src/features/renters/hooks/useContactPicker";
import { updateSupplier } from "@/src/features/suppliers/api/suppliers";
import { SupplierForm } from "@/src/features/suppliers/components/SupplierForm";
import { useSupplierForm } from "@/src/features/suppliers/hooks/useSupplierForm";
import { useSuppliersList } from "@/src/features/suppliers/hooks/useSuppliersList";
import { LoadingOverlay, ScreenContainer } from "@/src/shared/components/ui";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, Text, useTheme } from "react-native-paper";

export function AddEditSupplierScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { refreshSuppliers } = useSuppliersList();
  const isEdit = Boolean(id);
  const navigation = useNavigation();

  const { formMethods, onSubmit, isSubmitting, isFetching } = useSupplierForm({
    id,
    t,
    refreshSuppliers,
    onSuccess: () => router.back(),
  });

  const { formState, control, setValue } = formMethods;
  const { requestPermission, pickContact } = useContactPicker();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = React.useCallback(async () => {
    if (!id) return;
    const numericId = parseInt(id, 10);
    if (Number.isNaN(numericId)) return;

    Alert.alert(
      t("suppliers.deleteConfirmTitle", { defaultValue: "Delete supplier?" }),
      t("suppliers.deleteConfirmMessage", {
        defaultValue:
          "This will deactivate the supplier. You can reactivate it later by editing.",
      }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("suppliers.delete", { defaultValue: "Delete Supplier" }),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await updateSupplier(numericId, { is_active: false });
              await refreshSuppliers();
              router.back();
            } catch (err) {
              Alert.alert(
                t("error.title"),
                getApiErrorMessage(err, "Failed to delete supplier"),
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  }, [id, refreshSuppliers, router, t]);

  const handlePickFromContacts = React.useCallback(async () => {
    const status = await requestPermission();
    if (status !== "granted") {
      Alert.alert(t("error.title"), t("renter.contactsPermissionDenied"));
      return;
    }
    const picked = await pickContact();
    if (picked) {
      const name =
        [picked.firstName, picked.lastName].filter(Boolean).join(" ").trim() ||
        picked.firstName ||
        picked.lastName ||
        "";
      setValue("name", name, { shouldDirty: true });
      setValue("phone", picked.phone, { shouldDirty: true });
      setValue("email", picked.email, { shouldDirty: true });
    }
  }, [requestPermission, pickContact, setValue, t]);

  React.useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!formState.isDirty) return;
      e.preventDefault();
      Alert.alert(
        t("common.discardChanges"),
        t("common.discardChangesMessage"),
        [
          { text: t("common.cancel"), style: "cancel", onPress: () => {} },
          {
            text: t("common.discard"),
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsub;
  }, [navigation, formState.isDirty, t]);

  const handleHeaderBack = () => {
    router.back();
  };

  const onPressSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit();
  };

  if (isEdit && isFetching) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.wrapper}>
        <View
          style={[
            styles.header,
            { flexDirection: isRtl ? "row-reverse" : "row" },
          ]}
        >
          <TouchableOpacity
            onPress={handleHeaderBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={t("common.back")}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name={isRtl ? "chevron-right" : "chevron-left"}
              size={28}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isEdit
              ? t("suppliers.edit", { defaultValue: "Edit Supplier" })
              : t("suppliers.add", { defaultValue: "Add Supplier" })}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          enableOnAndroid
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={spacing.keyboardExtraScrollHeight}
          bounces={false}
        >
          <SupplierForm
            control={control}
            isEdit={isEdit}
            onPickFromContacts={handlePickFromContacts}
          />
        </KeyboardAwareScrollView>
        <View style={styles.fixedButtonBar}>
          <Button
            mode="contained"
            onPress={onPressSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || isDeleting}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {isEdit
              ? t("suppliers.updateSupplier", {
                  defaultValue: "Update Supplier",
                })
              : t("suppliers.saveSupplier", { defaultValue: "Save Supplier" })}
          </Button>
          {isEdit && (
            <Button
              mode="text"
              onPress={handleDelete}
              disabled={isSubmitting || isDeleting}
              loading={isDeleting}
              textColor={theme.colors.error}
              style={styles.deleteButton}
            >
              {t("suppliers.delete", { defaultValue: "Delete Supplier" })}
            </Button>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.formPaddingHorizontal,
    paddingBottom: 24,
  },
  fixedButtonBar: {
    marginTop: "auto",
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
    // paddingBottom: 4,
  },
  saveButton: {
    borderRadius: 12,
  },
  saveButtonContent: {
    minHeight: 48,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
});
