import { LoadingOverlay, ScreenContainer, StepHeader } from "@/src/shared/components/ui";
import { usePropertyContext } from "@/src/context";
import { usePropertyForm } from "@/src/features/properties/hooks/usePropertyForm";
import { BasicInfoCard } from "@/src/features/properties/components/BasicInfoCard";
import { LeaseInfoCard } from "@/src/features/properties/components/LeaseInfoCard";
import { spacing } from "@/src/core/theme";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  StyleSheet,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { FormScrollView } from "@/src/shared/components/form";

export function AddEditPropertyScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { refreshProperties } = usePropertyContext();
  const isEdit = Boolean(id);

  const navigation = useNavigation();

  const {
    formMethods,
    onSubmit,
    isSubmitting,
    isFetching,
    imageUri,
    setImageUri,
    ownerId,
  } = usePropertyForm({
    id,
    t,
    refreshProperties,
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
      "address",
      "city",
      "type",
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
        <FormScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <StepHeader
            title={isEdit ? t("property.updateProperty") : t("property.addProperty")}
            currentStep={step === "basic" ? 1 : 2}
            totalSteps={2}
            onBack={handleHeaderBack}
          />
          {step === "basic" && (
            <BasicInfoCard
              control={control}
              t={t}
              imageUri={imageUri}
              setImageUri={setImageUri}
              ownerId={ownerId}
            />
          )}
          {step === "lease" && <LeaseInfoCard control={control} t={t} ownerId={ownerId} />}
        </FormScrollView>
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
                isEdit ? t("property.updateProperty") : t("property.addProperty")
              }
              accessibilityRole="button"
            >
              {isEdit ? t("property.updateProperty") : t("property.addProperty")}
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
