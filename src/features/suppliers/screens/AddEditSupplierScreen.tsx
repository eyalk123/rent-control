import { useLanguageContext } from "@/src/context";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import { useAlert } from "@/src/core/context";
import { useContactPicker } from "@/src/features/renters/hooks/useContactPicker";
import { SupplierForm } from "@/src/features/suppliers/components/SupplierForm";
import { useSupplierForm } from "@/src/features/suppliers/hooks/useSupplierForm";
import { useSuppliersList } from "@/src/features/suppliers/hooks/useSuppliersList";
import { Icon, LoadingOverlay, ScreenContainer } from "@/src/shared/components/ui";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { FormScrollView } from "@/src/shared/components/form";
import { Button, Text, useTheme } from "react-native-paper";

export function AddEditSupplierScreen() {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { refreshSuppliers } = useSuppliersList();
  const isEdit = Boolean(id);
  const navigation = useNavigation();

  const { formMethods, onSubmit, isSubmitting, isFetching, fetchError } = useSupplierForm({
    id,
    t,
    refreshSuppliers,
    onSuccess: () => router.back(),
  });

  const { formState, control, setValue } = formMethods;
  const { requestPermission, pickContact } = useContactPicker();

  const handlePickFromContacts = React.useCallback(async () => {
    const status = await requestPermission();
    if (status !== "granted") {
      appAlert(t("error.title"), t("renter.contactsPermissionDenied"));
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
      appAlert(
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
  }, [navigation, formState.isDirty, t, appAlert]);

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

  if (isEdit && fetchError) {
    return (
      <ScreenContainer>
        <View style={styles.wrapper}>
          <View style={[styles.header, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel={t('common.back')}
              accessibilityRole="button"
            >
              <Icon
                name={isRtl ? 'chevron-right' : 'chevron-left'}
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>
          <Text style={[{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }]}>
            {fetchError}
          </Text>
        </View>
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
            <Icon
              name={isRtl ? "chevron-right" : "chevron-left"}
              size={24}
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
        <FormScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <SupplierForm
            control={control}
            isEdit={isEdit}
            onPickFromContacts={handlePickFromContacts}
          />
        </FormScrollView>
        <View style={styles.fixedButtonBar}>
          <Button
            mode="contained"
            onPress={onPressSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {isEdit
              ? t("suppliers.updateSupplier", {
                  defaultValue: "Update Supplier",
                })
              : t("suppliers.saveSupplier", { defaultValue: "Save Supplier" })}
          </Button>
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
});
