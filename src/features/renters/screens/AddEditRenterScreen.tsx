import { LoadingOverlay, ScreenContainer, StepHeader } from "@/src/shared/components/ui";
import { useRenterContext, usePropertyContext } from "@/src/context";
import { useWatch } from "react-hook-form";
import { useRenterForm } from "@/src/features/renters/hooks/useRenterForm";
import { useContactPicker } from "@/src/features/renters/hooks/useContactPicker";
import { RenterBasicInfoCard } from "@/src/features/renters/components/RenterBasicInfoCard";
import { RenterLeaseInfoCard } from "@/src/features/renters/components/RenterLeaseInfoCard";
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
import { Button } from "react-native-paper";

export function AddEditRenterScreen() {
  const { t } = useTranslation();
  const { appAlert } = useAlert();
  const { id, propertyId, fromScan } = useLocalSearchParams<{
    id?: string;
    propertyId?: string;
    fromScan?: string;
  }>();
  const router = useRouter();
  const { refreshRenters } = useRenterContext();
  const isEdit = Boolean(id);
  const navigation = useNavigation();

  // Consume the scanned-document draft once (only when arriving via the scan flow).
  const [scan] = React.useState(() =>
    fromScan === "1" && !id ? consumeRenterPrefill() : null,
  );

  const { formMethods, onSubmit, isSubmitting, isFetching, ownerId } = useRenterForm({
    id,
    t,
    refreshRenters,
    onSuccess: () => router.back(),
    initialPropertyId: propertyId ? Number(propertyId) : (scan?.matchedPropertyId ?? null),
    prefill: scan?.renter,
    pendingFullContract: scan?.file ?? null,
    logId: scan?.logId,
    provenance: scan?.renterProvenance,
  });

  const { formState, control, trigger, setValue } = formMethods;

  // Renter-scan property association: preselect the matched property, and softly warn if the
  // user picks one whose address differs from the lease. The picker stays the source of truth.
  const { properties } = usePropertyContext();
  const selectedPropertyId = useWatch({ control, name: "propertyId" });
  const scannedLeaseAddress = scan?.property
    ? { address: scan.property.address, city: scan.property.city }
    : undefined;
  const propertyMismatch =
    !!scannedLeaseAddress?.address && selectedPropertyId != null
      ? (() => {
          const p = properties.find((pp) => pp.id === Number(selectedPropertyId));
          return p ? !addressesMatch(p, scannedLeaseAddress) : false;
        })()
      : false;

  // "Create property from lease": re-seed the handoff with the property draft and switch flows.
  const handleCreatePropertyFromScan = () => {
    if (!scan) return;
    setScanHandoff({
      logId: scan.logId,
      property: scan.property,
      propertyReview: scan.propertyReview,
      propertyProvenance: scan.propertyProvenance,
      renter: scan.renter,
      renterReview: scan.renterReview,
      renterProvenance: scan.renterProvenance,
      file: scan.file,
    });
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
          <FieldReviewProvider items={scan?.renterReview}>
          <StepHeader
            title={isEdit ? t("renter.updateRenter") : t("renter.addRenter")}
            currentStep={step === "basic" ? 1 : 2}
            totalSteps={2}
            onBack={handleHeaderBack}
          />
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
          {step === "lease" && <RenterLeaseInfoCard control={control} t={t} ownerId={ownerId} />}
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
