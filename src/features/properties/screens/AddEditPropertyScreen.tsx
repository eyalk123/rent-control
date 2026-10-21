import { LoadingOverlay, ScreenContainer, FormHeader } from "@/src/shared/components/ui";
import { usePropertyContext } from "@/src/context";
import { usePropertyForm } from "@/src/features/properties/hooks/usePropertyForm";
import { BasicInfoCard } from "@/src/features/properties/components/BasicInfoCard";
import { usePropertyOwnersList } from "@/src/features/property-owners/hooks/usePropertyOwnersList";
import { LeaseInfoCard } from "@/src/features/properties/components/LeaseInfoCard";
import { PurchaseValueCard } from "@/src/features/properties/components/PurchaseValueCard";
import { MortgageFormCard } from "@/src/features/properties/components/MortgageFormCard";
import { capabilities } from "@/src/shared/utils/capabilities";
import { PropertyValueDialog } from "@/src/features/properties/components/PropertyValueDialog";
import { PropertyCreatedPrompt } from "@/src/features/properties/components/PropertyCreatedPrompt";
import { PropertyScanConflicts } from "@/src/features/properties/components/PropertyScanConflicts";
import { consumePropertyPrefill } from "@/src/features/document-scan/handoff";
import { FieldReviewProvider } from "@/src/shared/components/form/FieldReviewContext";
import type { Property } from "@/src/shared/types";
import { leastUsedEntityColor, spacing } from "@/src/core/theme";
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
import { useTourStep } from "@/src/features/onboarding/TourController";

export function AddEditPropertyScreen() {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const { id, fromScan } = useLocalSearchParams<{ id?: string; fromScan?: string }>();
  const router = useRouter();
  const { properties, refreshProperties } = usePropertyContext();
  const isEdit = Boolean(id);
  const { owners, loaded: ownersLoaded, refreshOwners } = usePropertyOwnersList();

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
    color,
    setColor,
    ownerId,
    existingFiles,
    deletedFileIds,
    setDeletedFileIds,
    conflicts,
    conflictChoices,
    resolveConflict,
    storedValue,
    pendingValuation,
    setPendingValuation,
    hadMortgage,
  } = usePropertyForm({
    id,
    t,
    refreshProperties,
    owners: ownersLoaded ? owners : null,
    prefill: scan?.property,
    logId: scan?.logId,
    provenance: scan?.propertyProvenance,
    suggestedColor: isEdit ? null : leastUsedEntityColor(properties.map((p) => p.color)),
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

  const { formState, control, trigger, setFocus } = formMethods;
  const [step, setStep] = React.useState<"basic" | "lease">("basic");
  const [valueDialogOpen, setValueDialogOpen] = React.useState(false);
  // Derived, never written: `useTourStep` goes null the moment the tour ends and the form is
  // back on whichever page the user was actually filling in, with nothing to restore. It also
  // means the page-one validation that `onPressNext` runs is never triggered behind the tour.
  const tourStep = useTourStep("property-form");
  const shownStep = tourStep === "records" ? "lease" : step;

  React.useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (allowRemoveRef.current) return;
      // Prompt when the user has edited the form OR arrived via the scan flow with prefilled
      // data (which RHF treats as pristine because it lives in defaultValues).
      if (!formState.isDirty && !scan && !pendingValuation) return;
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
  }, [navigation, formState.isDirty, scan, pendingValuation, t, appAlert]);

  const handleHeaderBack = () => {
    if (step === "lease") {
      setStep("basic");
      return;
    }
    router.back();
  };

  const PAGE_ONE_REQUIRED = ["address", "city", "type"] as const;

  const onPressNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isValid = await trigger([...PAGE_ONE_REQUIRED]);
    if (!isValid) {
      // Tapping Next from the bottom of the form used to do nothing you could see: the errors
      // appeared off screen and the view stayed put. Focusing the first bad field scrolls it
      // into view, because the whole form sits in a KeyboardAwareScrollView.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const firstBad = PAGE_ONE_REQUIRED.find((f) => formState.errors[f]);
      if (firstBad) setFocus(firstBad);
      return;
    }
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
          resetScrollKey={step}
        >
          <FieldReviewProvider items={scan?.propertyReview}>
          {/* Anchored here rather than inside FormHeader: the header is shared with the
              renter form, and an anchor key must belong to exactly one screen. */}
          <TourAnchor id={ANCHORS.propertyFormStepper}>
            <FormHeader
              title={isEdit ? t("property.updateProperty") : t("property.addProperty")}
              currentStep={shownStep === "basic" ? 1 : 2}
              totalSteps={2}
              onBack={handleHeaderBack}
            />
          </TourAnchor>
          {shownStep === "basic" && (
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
                color={color}
                setColor={setColor}
                ownerId={ownerId}
                addressEvidence={scan?.addressEvidence}
                owners={owners}
                ownersLoaded={ownersLoaded}
                onReloadOwners={refreshOwners}
                onAddOwner={(name) =>
                  router.push({ pathname: "/properties/add-owner", params: name ? { name } : {} } as any)
                }
              />
            </>
          )}
          {shownStep === "lease" && (
            <PurchaseValueCard
              control={control}
              t={t}
              currentValue={pendingValuation?.value ?? storedValue?.value ?? null}
              currentValueDate={pendingValuation?.valued_on ?? storedValue?.date ?? null}
              pending={!!pendingValuation}
              onAddValue={() => setValueDialogOpen(true)}
            />
          )}
          {shownStep === "lease" && capabilities().mortgage && (
            <MortgageFormCard control={control} t={t} hadMortgage={hadMortgage} />
          )}
          {shownStep === "lease" && (
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
      <PropertyValueDialog
        visible={valueDialogOpen}
        onConfirm={(valuation) => {
          setPendingValuation(valuation);
          setValueDialogOpen(false);
        }}
        onDismiss={() => setValueDialogOpen(false)}
      />
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
