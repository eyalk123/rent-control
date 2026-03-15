import { LoadingOverlay, ScreenContainer } from "@/src/shared/components/ui";
import { useLanguageContext, useRenterContext } from "@/src/context";
import { useRenterForm } from "@/src/features/renters/hooks/useRenterForm";
import { RenterBasicInfoCard } from "@/src/features/renters/components/RenterBasicInfoCard";
import { RenterLeaseInfoCard } from "@/src/features/renters/components/RenterLeaseInfoCard";
import { darkColors, lightColors, spacing } from "@/src/core/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Button, useTheme } from "react-native-paper";

export function AddEditRenterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { refreshRenters } = useRenterContext();
  const isEdit = Boolean(id);
  const navigation = useNavigation();

  const { formMethods, onSubmit, isSubmitting, isFetching } = useRenterForm({
    id,
    t,
    refreshRenters,
    onSuccess: () => router.back(),
  });

  const { formState, control, trigger } = formMethods;
  const [step, setStep] = React.useState<"basic" | "lease">("basic");

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
    if (step === "lease") {
      setStep("basic");
      return;
    }
    router.back();
  };

  const onPressNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isValid = await trigger([
      "firstName",
      "lastName",
      "phone",
      "email",
      "monthlyRent",
    ]);
    if (!isValid) return;
    setStep("lease");
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
        <KeyboardAwareScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={spacing.keyboardExtraScrollHeight}
          bounces={false}
        >
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
              {isEdit ? t("renter.updateRenter") : t("renter.addRenter")}
            </Text>
            <View style={styles.headerSpacer} />
          </View>
          {step === "basic" && <RenterBasicInfoCard control={control} t={t} />}
          {step === "lease" && <RenterLeaseInfoCard control={control} t={t} />}
        </KeyboardAwareScrollView>
        <View style={styles.fixedButtonBar}>
          {step === "basic" && (
            <Button
              mode="contained"
              onPress={onPressNext}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
              accessibilityLabel={t("common.next")}
              accessibilityRole="button"
            >
              {t("common.next")}
            </Button>
          )}
          {step === "lease" && (
            <Button
              mode="contained"
              onPress={onPressSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
              accessibilityLabel={
                isEdit ? t("renter.updateRenter") : t("renter.addRenter")
              }
              accessibilityRole="button"
            >
              {isEdit ? t("renter.updateRenter") : t("renter.addRenter")}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.formPaddingHorizontal,
    gap: spacing.sm,
    paddingBottom: 24,
  },
  header: {
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    width: 28,
  },
  fixedButtonBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: 24,
  },
  saveButton: {
    borderRadius: 12,
  },
  saveButtonContent: {
    minHeight: 48,
  },
});
