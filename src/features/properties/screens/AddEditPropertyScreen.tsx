import { LoadingOverlay, ScreenContainer, StepHeader } from "@/src/shared/components/ui";
import { usePropertyContext } from "@/src/context";
import { usePropertyForm } from "@/src/features/properties/hooks/usePropertyForm";
import { BasicInfoCard } from "@/src/features/properties/components/BasicInfoCard";
import { LeaseInfoCard } from "@/src/features/properties/components/LeaseInfoCard";
import { PropertyCreatedPrompt } from "@/src/features/properties/components/PropertyCreatedPrompt";
import { PropertyScanConflicts } from "@/src/features/properties/components/PropertyScanConflicts";
import { consumePropertyPrefill } from "@/src/features/document-scan/handoff";
import { FieldReviewProvider } from "@/src/shared/components/form/FieldReviewContext";
import type { Property } from "@/src/shared/types";
import { spacing } from "@/src/core/theme";
import { useAlert } from "@/src/core/context";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import { FormScrollView } from "@/src/shared/components/form";
import { ANCHORS } from "@/src/features/onboarding/anchors";
import { TourAnchor } from "@/src/features/onboarding/AnchorRegistry";

export function AddEditPropertyScreen() {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const { id, fromScan } = useLocalSearchParams<{ id?: string; fromScan?: string }>();
  const router = useRouter();
  const { refreshProperties } = usePropertyContext();
  const isEdit = Boolean(id);

  const navigation = useNavigation();
  // Flipped to true right before an intentional (post-save / flow-pivot) navigation so the
  // discard guard lets it through instead of prompting.
  const allowRemoveRef = React.useRef(false);
  const [createdProperty, setCreatedProperty] = React.useState<Property | null>(
    null,
  );

  // Consume the scanned-document draft once (arriving via the scan flow — create, or attaching
  // to an existing property in which case `id` is also present).
  const [scan] = React.useState(() =>
    fromScan === "1" ? consumePropertyPrefill() : null,
  );

  const {
    formMethods,
    onSubmit,
    isSubmitting,
    isFetching,
    imageUri,
    setImageUri,
    ownerId,
    existingFiles,
    deletedFileIds,
    setDeletedFileIds,
    conflicts,
    conflictChoices,
    resolveConflict,
  } = usePropertyForm({
    id,
    t,
    refreshProperties,
    prefill: scan?.property,
    logId: scan?.logId,
    provenance: scan?.propertyProvenance,
    onSuccess: (savedProp) => {
      if (scan) {
        // Scan flow (create or attach-to-existing): the renters were already extracted —
        // continue straight into the renter form(s) instead of interrupting or just closing.
        allowRemoveRef.current = true;
        router.replace(`/renters/add?propertyId=${savedProp.id}&fromScan=1` as any);
      } else if (isEdit) {
        allowRemoveRef.current = true;
        router.back();
      } else {
        setCreatedProperty(savedProp);
      }
    },
  });

  const { formState, control, trigger } = formMethods;
  const [step, setStep] = React.useState<"basic" | "lease">("basic");

  React.useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (allowRemoveRef.current) return;
      // Prompt when the user has edited the form OR arrived via the scan flow with prefilled
      // data (which RHF treats as pristine because it lives in defaultValues).
      if (!formState.isDirty && !scan) return;
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
  }, [navigation, formState.isDirty, scan, t, appAlert]);

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
          <FieldReviewProvider items={scan?.propertyReview}>
          {/* Anchored here rather than inside StepHeader: the header is shared with the
              renter form, and an anchor key must belong to exactly one screen. */}
          <TourAnchor id={ANCHORS.propertyFormStepper}>
            <StepHeader
              title={isEdit ? t("property.updateProperty") : t("property.addProperty")}
              currentStep={step === "basic" ? 1 : 2}
              totalSteps={2}
              onBack={handleHeaderBack}
            />
          </TourAnchor>
          {step === "basic" && (
            <>
              <PropertyScanConflicts
                conflicts={conflicts}
                choices={conflictChoices}
                onResolve={resolveConflict}
                t={t}
              />
              <BasicInfoCard
                control={control}
                t={t}
                imageUri={imageUri}
                setImageUri={setImageUri}
                ownerId={ownerId}
                addressEvidence={scan?.addressEvidence}
              />
            </>
          )}
          {step === "lease" && (
            <LeaseInfoCard
              control={control}
              t={t}
              ownerId={ownerId}
              existingFiles={existingFiles}
              deletedFileIds={deletedFileIds}
              onDeleteExistingToggle={(id) =>
                setDeletedFileIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                )
              }
            />
          )}
          </FieldReviewProvider>
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
      <PropertyCreatedPrompt
        visible={!!createdProperty}
        onAddRenter={() => {
          allowRemoveRef.current = true;
          router.replace(
            `/renters/add?propertyId=${createdProperty!.id}${scan ? "&fromScan=1" : ""}` as any,
          );
        }}
        onSkip={() => {
          allowRemoveRef.current = true;
          router.back();
        }}
      />
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
