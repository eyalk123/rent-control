import { LoadingOverlay, ScreenContainer, StepHeader } from "@/src/shared/components/ui";
import { useRenterContext, usePropertyContext } from "@/src/context";
import { useWatch } from "react-hook-form";
import { useRenterForm } from "@/src/features/renters/hooks/useRenterForm";
import { useContactPicker } from "@/src/features/renters/hooks/useContactPicker";
import { RenterBasicInfoCard } from "@/src/features/renters/components/RenterBasicInfoCard";
import { RenterLeaseInfoCard } from "@/src/features/renters/components/RenterLeaseInfoCard";
import { RenterScanConflicts } from "@/src/features/renters/components/RenterScanConflicts";
import { ScanPropertyNotice } from "@/src/features/document-scan/components/ScanPropertyNotice";
import { consumeRenterPrefill, setScanHandoff } from "@/src/features/document-scan/handoff";
import { addressesMatch } from "@/src/features/document-scan/matchProperty";
import { FieldReviewProvider } from "@/src/shared/components/form/FieldReviewContext";
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
import { FormScrollView } from "@/src/shared/components/form";
import { Button, Text, useTheme } from "react-native-paper";

export function AddEditRenterScreen() {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const { id, propertyId, fromScan } = useLocalSearchParams<{
    id?: string;
    propertyId?: string;
    fromScan?: string;
  }>();
  const router = useRouter();
  const theme = useTheme();
  const { refreshRenters } = useRenterContext();
  const isEdit = Boolean(id);
  const navigation = useNavigation();
  // Flipped to true right before an intentional (post-save / flow-pivot) navigation so the
  // discard guard lets it through instead of prompting.
  const allowRemoveRef = React.useRef(false);

  // Consume the scanned-document draft once (only when arriving via the scan flow).
  const [scan] = React.useState(() =>
    fromScan === "1" && !id ? consumeRenterPrefill() : null,
  );

  // Multi-renter scan: verify each co-tenant in turn. Saving one advances the cursor to the
  // next; only the last returns to the list.
  const renters = scan?.renters ?? [];
  const [qIndex, setQIndex] = React.useState(0);
  const current = renters[qIndex];
  const hasNextRenter = qIndex < renters.length - 1;

  const { formMethods, onSubmit, isSubmitting, isFetching, ownerId, conflicts, conflictChoices, resolveConflict, contractConflict, contractChoice, resolveContractConflict } = useRenterForm({
    id,
    t,
    refreshRenters,
    onSuccess: () => {
      if (hasNextRenter) {
        setQIndex((i) => i + 1);
        setStep("basic");
      } else {
        allowRemoveRef.current = true;
        router.back();
      }
    },
    initialPropertyId: propertyId ? Number(propertyId) : (scan?.matchedPropertyId ?? null),
    prefill: current?.prefill,
    prefillNonce: qIndex,
    existingRenterId: current?.existingRenterId ?? null,
    pendingFullContract: scan?.file ?? null,
    logId: scan?.logId,
    provenance: current?.provenance,
  });

  const { formState, control, trigger, setValue } = formMethods;

  // Renter-scan property association: preselect the matched property, and softly warn if the
  // user picks one whose address differs from the lease. The picker stays the source of truth.
  const { properties } = usePropertyContext();
  const selectedPropertyId = useWatch({ control, name: "propertyId" });
  const scannedLeaseAddress = scan?.property
    ? {
        address: scan.property.address,
        city: scan.property.city,
        floor: scan.property.floor,
        apartment: scan.property.apartment,
      }
    : undefined;
  const propertyMismatch =
    !!scannedLeaseAddress?.address && selectedPropertyId != null
      ? (() => {
          const p = properties.find((pp) => pp.id === Number(selectedPropertyId));
          return p ? !addressesMatch(p, scannedLeaseAddress) : false;
        })()
      : false;

  // "Create property from lease": re-seed the handoff with the property draft + renter queue
  // and switch flows (property → renter chain).
  const handleCreatePropertyFromScan = () => {
    if (!scan) return;
    setScanHandoff({
      logId: scan.logId,
      property: scan.property,
      propertyReview: scan.propertyReview,
      propertyProvenance: scan.propertyProvenance,
      renters: scan.renters,
      file: scan.file,
    });
    // Deliberate "create property from lease" pivot — the renter data is preserved in the
    // handoff, so this is not a discard.
    allowRemoveRef.current = true;
    router.replace("/properties/add?fromScan=1" as any);
  };
  const [step, setStep] = React.useState<"basic" | "lease">("basic");
  const { requestPermission, pickContact } = useContactPicker();

  const handlePickFromContacts = React.useCallback(async () => {
    const status = await requestPermission();
    if (status !== "granted") {
      appAlert(
        t("error.title"),
        t("renter.contactsPermissionDenied"),
      );
      return;
    }
    const picked = await pickContact();
    if (picked) {
      setValue("firstName", picked.firstName, { shouldDirty: true });
      setValue("lastName", picked.lastName, { shouldDirty: true });
      setValue("phone", picked.phone, { shouldDirty: true });
      setValue("email", picked.email, { shouldDirty: true });
      setValue("contactId", picked.contactId, { shouldDirty: true });
    }
  }, [requestPermission, pickContact, setValue, t]);

  const handlePickExtraContact = React.useCallback(async () => {
    const status = await requestPermission();
    if (status !== "granted") return null;
    const picked = await pickContact();
    if (!picked) return null;
    const name = [picked.firstName, picked.lastName].filter(Boolean).join(" ");
    return { name, phone: picked.phone };
  }, [requestPermission, pickContact]);

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
      "firstName",
      "lastName",
      "phone",
      "email",
    ]);
    if (!isValid) return;
    setStep("lease");
  };

  const onPressSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit();
  };

  // Show the loading overlay while fetching an existing renter — a plain edit or a scanned
  // duplicate we're editing in place (the latter has no route `id`, so key off `isFetching`).
  if (isFetching) {
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
          <FieldReviewProvider items={current?.review}>
          <StepHeader
            title={isEdit ? t("renter.updateRenter") : t("renter.addRenter")}
            currentStep={step === "basic" ? 1 : 2}
            totalSteps={2}
            onBack={handleHeaderBack}
          />
          {renters.length > 1 && (
            <Text variant="labelMedium" style={[styles.renterProgress, { color: theme.colors.primary }]}>
              {t("documentScan.renterProgress", { current: qIndex + 1, total: renters.length })}
            </Text>
          )}
          {step === "basic" && (
            <>
              {scan && (
                <ScanPropertyNotice
                  matchStatus={scan.propertyMatchStatus}
                  hasSelection={selectedPropertyId != null}
                  mismatch={propertyMismatch}
                  onCreateProperty={handleCreatePropertyFromScan}
                />
              )}
              <RenterScanConflicts
                conflicts={conflicts}
                choices={conflictChoices}
                onResolve={resolveConflict}
                contractConflict={contractConflict}
                contractChoice={contractChoice}
                onResolveContract={resolveContractConflict}
                scannedFileName={scan?.file?.name}
                t={t}
              />
              <RenterBasicInfoCard
                control={control}
                t={t}
                ownerId={ownerId}
                isEdit={isEdit}
                onPickFromContacts={handlePickFromContacts}
                onPickExtraContact={handlePickExtraContact}
              />
            </>
          )}
          {step === "lease" && (
            <RenterLeaseInfoCard control={control} t={t} ownerId={ownerId} setValue={setValue} />
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
                hasNextRenter
                  ? t("documentScan.saveAndNextRenter")
                  : isEdit
                  ? t("renter.updateRenter")
                  : t("renter.addRenter")
              }
              accessibilityRole="button"
            >
              {hasNextRenter
                ? t("documentScan.saveAndNextRenter")
                : isEdit
                ? t("renter.updateRenter")
                : t("renter.addRenter")}
            </Button>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  renterProgress: {
    marginTop: spacing.xs,
  },
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
