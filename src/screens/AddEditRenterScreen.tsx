import { getApiErrorMessage } from "@/src/api/client";
import { createRenter, getRenterById, updateRenter } from "@/src/api/renters";
import {
    LoadingOverlay,
    PropertyPicker,
    ScreenContainer,
} from "@/src/components";
import {
    useLanguageContext,
    useRenterContext,
    useRtlInputStyle,
    useRtlPlaceholder,
    useSectionHeaderStyle,
} from "@/src/context";
import { darkColors, lightColors, spacing } from "@/src/theme";
import type { RenterCreate, RenterUpdate } from "@/src/types";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AddEditRenterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const rtlInputStyle = useRtlInputStyle();
  const sectionHeaderStyle = useSectionHeaderStyle();
  const { isRtl } = useLanguageContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { refreshRenters } = useRenterContext();
  const rtlPlaceholder = useRtlPlaceholder();
  const isEdit = Boolean(id);
  const submitBarHeight = 72;
  const bottomPadding = submitBarHeight + insets.bottom + spacing.md;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [leaseStart, setLeaseStart] = useState("");
  const [leaseEnd, setLeaseEnd] = useState("");
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const [numberOfPayments, setNumberOfPayments] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [paymentDayOfMonth, setPaymentDayOfMonth] = useState("");
  const [insuranceType, setInsuranceType] = useState("");
  const [insuranceAmount, setInsuranceAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(isEdit);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const navigation = useNavigation();

  const clearError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  React.useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (!dirty) return;
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
  }, [navigation, dirty, t]);

  React.useEffect(() => {
    if (isEdit && id) {
      const numericId = Number(id);
      if (!isNaN(numericId)) {
        setFormLoading(true);
        getRenterById(numericId)
          .then((renter) => {
            setFirstName(renter.first_name);
            setLastName(renter.last_name);
            setPhone(renter.phone);
            setEmail(renter.email);
            setMonthlyRent(renter.monthly_rent.toString());
            setLeaseStart(renter.lease_start);
            setLeaseEnd(renter.lease_end);
            setPropertyId(renter.property_id);
            setNumberOfPayments(
              renter.number_of_payments != null
                ? String(renter.number_of_payments)
                : "",
            );
            setPaymentType(renter.payment_type ?? "");
            setPaymentDayOfMonth(
              renter.payment_day_of_month != null
                ? String(renter.payment_day_of_month)
                : "",
            );
            setInsuranceType(renter.insurance_type ?? "");
            setInsuranceAmount(
              renter.insurance_amount != null
                ? String(renter.insurance_amount)
                : "",
            );
          })
          .finally(() => setFormLoading(false));
      } else {
        setFormLoading(false);
      }
    }
  }, [isEdit, id]);

  const handleSubmit = async () => {
    const rentNum = parseFloat(monthlyRent);
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = t("validation.firstNameRequired");
    if (!lastName.trim()) errors.lastName = t("validation.lastNameRequired");
    if (!phone.trim()) errors.phone = t("validation.phoneRequired");
    if (!email.trim()) errors.email = t("validation.emailRequired");
    if (isNaN(rentNum) || rentNum < 0)
      errors.monthlyRent = t("validation.rentRequired");
    const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
    if (!leaseStart.trim())
      errors.leaseStart = t("validation.leaseStartRequired");
    else if (!dateFormat.test(leaseStart.trim()))
      errors.leaseStart = t("validation.dateFormatInvalid");
    if (!leaseEnd.trim()) errors.leaseEnd = t("validation.leaseEndRequired");
    else if (!dateFormat.test(leaseEnd.trim()))
      errors.leaseEnd = t("validation.dateFormatInvalid");
    const paymentDayNum = paymentDayOfMonth.trim()
      ? parseInt(paymentDayOfMonth, 10)
      : null;
    if (
      paymentDayNum != null &&
      (isNaN(paymentDayNum) || paymentDayNum < 1 || paymentDayNum > 31)
    ) {
      errors.paymentDayOfMonth = t("validation.paymentDayInvalid");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const numPayments = numberOfPayments.trim()
      ? parseInt(numberOfPayments, 10)
      : null;
    const insuranceAmt = insuranceAmount.trim()
      ? parseFloat(insuranceAmount)
      : null;

    const baseCreate: RenterCreate = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      monthly_rent: rentNum,
      lease_start: leaseStart.trim(),
      lease_end: leaseEnd.trim(),
      property_id: propertyId ?? undefined,
    };
    if (numPayments != null && !isNaN(numPayments))
      baseCreate.number_of_payments = numPayments;
    if (paymentType.trim()) baseCreate.payment_type = paymentType.trim();
    if (paymentDayNum != null) baseCreate.payment_day_of_month = paymentDayNum;
    if (insuranceType.trim()) baseCreate.insurance_type = insuranceType.trim();
    if (insuranceAmt != null && !isNaN(insuranceAmt))
      baseCreate.insurance_amount = insuranceAmt;

    const baseUpdate: RenterUpdate = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      monthly_rent: rentNum,
      lease_start: leaseStart.trim(),
      lease_end: leaseEnd.trim(),
      property_id: propertyId,
    };
    if (numPayments != null && !isNaN(numPayments))
      baseUpdate.number_of_payments = numPayments;
    if (paymentType.trim()) baseUpdate.payment_type = paymentType.trim();
    if (paymentDayNum != null) baseUpdate.payment_day_of_month = paymentDayNum;
    if (insuranceType.trim()) baseUpdate.insurance_type = insuranceType.trim();
    if (insuranceAmt != null && !isNaN(insuranceAmt))
      baseUpdate.insurance_amount = insuranceAmt;

    setLoading(true);
    try {
      if (isEdit && id) {
        const numericId = Number(id);
        await updateRenter(numericId, baseUpdate);
      } else {
        await createRenter(baseCreate);
      }

      await refreshRenters();
      router.back();
    } catch (err) {
      Alert.alert(
        t("error.title"),
        getApiErrorMessage(err, t("error.saveRenterFailed")),
      );
    } finally {
      setLoading(false);
    }
  };

  const onPressSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSubmit();
  };

  if (isEdit && formLoading) {
    return (
      <ScreenContainer>
        <LoadingOverlay visible={true} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View
        style={[
          styles.backBar,
          {
            paddingTop: insets.top + spacing.xs,
            paddingBottom: spacing.xs,
            paddingHorizontal: spacing.md,
            backgroundColor: theme.colors.background,
            borderBottomColor: colors.outline,
            flexDirection: isRtl ? "row-reverse" : "row",
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
          accessibilityLabel={t("common.back")}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name={isRtl ? "chevron-right" : "chevron-left"}
            size={28}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 56 : 0}
      >
        <ScrollView
          style={[styles.scroll, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomPadding, flexGrow: 1 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.profileSection}>
            <TouchableOpacity
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.inputFilledBackground, opacity: 0.7 },
              ]}
              onPress={() => {}}
              disabled
              accessibilityLabel={t("renter.profilePictureComingSoon")}
            >
              <MaterialCommunityIcons
                name="plus"
                size={28}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <Text
              variant="bodySmall"
              style={[styles.uploadLabel, { color: colors.textSecondary }]}
            >
              {t("renter.profilePictureComingSoon")}
            </Text>
          </View>

          <Card
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.cardBackground,
                elevation: theme.dark ? 4 : 2,
              },
            ]}
            mode="outlined"
          >
            <Card.Content style={styles.cardContent}>
              <View
                style={[
                  sectionHeaderStyle.containerStyle,
                  {
                    flexDirection: isRtl ? "row-reverse" : "row",
                    alignItems: "center",
                  },
                ]}
              >
                <View
                  style={[
                    styles.sectionAccent,
                    {
                      backgroundColor: colors.sectionAccent,
                      marginRight: isRtl ? 0 : spacing.sm,
                      marginLeft: isRtl ? spacing.sm : 0,
                    },
                  ]}
                />
                <Text
                  variant="titleLarge"
                  style={[styles.sectionHeader, sectionHeaderStyle.textStyle]}
                  numberOfLines={1}
                >
                  {t("renter.basicInfo")}
                </Text>
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={`${t("renter.firstName")} *`}
                  value={firstName}
                  onChangeText={(text) => {
                    clearError("firstName");
                    setFirstName(text);
                    setDirty(true);
                  }}
                  error={!!fieldErrors.firstName}
                  mode="outlined"
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
                {fieldErrors.firstName ? (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {fieldErrors.firstName}
                  </Text>
                ) : null}
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={`${t("renter.lastName")} *`}
                  value={lastName}
                  onChangeText={(text) => {
                    clearError("lastName");
                    setLastName(text);
                    setDirty(true);
                  }}
                  error={!!fieldErrors.lastName}
                  mode="outlined"
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
                {fieldErrors.lastName ? (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {fieldErrors.lastName}
                  </Text>
                ) : null}
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={`${t("renter.phone")} *`}
                  value={phone}
                  onChangeText={(text) => {
                    clearError("phone");
                    setPhone(text);
                    setDirty(true);
                  }}
                  error={!!fieldErrors.phone}
                  mode="outlined"
                  keyboardType="phone-pad"
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
                {fieldErrors.phone ? (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {fieldErrors.phone}
                  </Text>
                ) : null}
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={`${t("renter.email")} *`}
                  value={email}
                  onChangeText={(text) => {
                    clearError("email");
                    setEmail(text);
                    setDirty(true);
                  }}
                  error={!!fieldErrors.email}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
                {fieldErrors.email ? (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {fieldErrors.email}
                  </Text>
                ) : null}
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={`${t("renter.monthlyRent")} *`}
                  value={monthlyRent}
                  onChangeText={(text) => {
                    clearError("monthlyRent");
                    setMonthlyRent(text);
                  }}
                  error={!!fieldErrors.monthlyRent}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
                {fieldErrors.monthlyRent ? (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {fieldErrors.monthlyRent}
                  </Text>
                ) : null}
              </View>
            </Card.Content>
          </Card>

          <Card
            style={[
              styles.sectionCard,
              {
                backgroundColor: colors.cardBackground,
                elevation: theme.dark ? 4 : 2,
              },
            ]}
            mode="outlined"
          >
            <Card.Content style={styles.cardContent}>
              <View
                style={[
                  sectionHeaderStyle.containerStyle,
                  {
                    flexDirection: isRtl ? "row-reverse" : "row",
                    alignItems: "center",
                  },
                ]}
              >
                <View
                  style={[
                    styles.sectionAccent,
                    {
                      backgroundColor: colors.sectionAccent,
                      marginRight: isRtl ? 0 : spacing.sm,
                      marginLeft: isRtl ? spacing.sm : 0,
                    },
                  ]}
                />
                <Text
                  variant="titleLarge"
                  style={[styles.sectionHeader, sectionHeaderStyle.textStyle]}
                  numberOfLines={1}
                >
                  {t("renter.leaseInfo")}
                </Text>
              </View>
              <PropertyPicker
                value={propertyId}
                onChange={(id) => {
                  setPropertyId(id);
                  setDirty(true);
                }}
                label={t("renter.propertyOptional")}
                inputStyle={{ backgroundColor: colors.inputFilledBackground }}
              />
              <View style={styles.inputWrap}>
                <TextInput
                  label={`${t("renter.leaseStart")} *`}
                  value={leaseStart}
                  onChangeText={(text) => {
                    clearError("leaseStart");
                    setLeaseStart(text);
                  }}
                  error={!!fieldErrors.leaseStart}
                  mode="outlined"
                  placeholder={rtlPlaceholder(
                    t("renter.leaseStartPlaceholder"),
                  )}
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
                {fieldErrors.leaseStart ? (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {fieldErrors.leaseStart}
                  </Text>
                ) : (
                  <Text
                    variant="bodySmall"
                    style={[styles.helperText, { color: colors.textSecondary }]}
                  >
                    {t("renter.leaseStartPlaceholder")}
                  </Text>
                )}
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={`${t("renter.leaseEnd")} *`}
                  value={leaseEnd}
                  onChangeText={(text) => {
                    clearError("leaseEnd");
                    setLeaseEnd(text);
                    setDirty(true);
                  }}
                  error={!!fieldErrors.leaseEnd}
                  mode="outlined"
                  placeholder={rtlPlaceholder(t("renter.leaseEndPlaceholder"))}
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
                {fieldErrors.leaseEnd ? (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {fieldErrors.leaseEnd}
                  </Text>
                ) : (
                  <Text
                    variant="bodySmall"
                    style={[styles.helperText, { color: colors.textSecondary }]}
                  >
                    {t("renter.leaseEndPlaceholder")}
                  </Text>
                )}
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={t("renter.numberOfPayments")}
                  value={numberOfPayments}
                  onChangeText={(v) => {
                    setNumberOfPayments(v);
                    setDirty(true);
                  }}
                  mode="outlined"
                  keyboardType="numeric"
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={t("renter.paymentType")}
                  value={paymentType}
                  onChangeText={setPaymentType}
                  mode="outlined"
                  placeholder={rtlPlaceholder(
                    t("renter.paymentTypePlaceholder"),
                  )}
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={t("renter.dateOfPayment")}
                  value={paymentDayOfMonth}
                  onChangeText={(text) => {
                    clearError("paymentDayOfMonth");
                    setPaymentDayOfMonth(text);
                    setDirty(true);
                  }}
                  error={!!fieldErrors.paymentDayOfMonth}
                  mode="outlined"
                  keyboardType="numeric"
                  placeholder={rtlPlaceholder("1–31")}
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
                {fieldErrors.paymentDayOfMonth ? (
                  <Text
                    variant="bodySmall"
                    style={[styles.errorText, { color: colors.error }]}
                  >
                    {fieldErrors.paymentDayOfMonth}
                  </Text>
                ) : null}
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={t("renter.insuranceType")}
                  value={insuranceType}
                  onChangeText={(v) => {
                    setInsuranceType(v);
                    setDirty(true);
                  }}
                  mode="outlined"
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  label={t("renter.insuranceAmount")}
                  value={insuranceAmount}
                  onChangeText={(v) => {
                    setInsuranceAmount(v);
                    setDirty(true);
                  }}
                  mode="outlined"
                  keyboardType="decimal-pad"
                  dense
                  style={[
                    styles.input,
                    { backgroundColor: colors.inputFilledBackground },
                    rtlInputStyle,
                  ]}
                  contentStyle={rtlInputStyle}
                />
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
        <View
          style={[
            styles.submitBar,
            {
              paddingBottom: insets.bottom + spacing.sm,
              backgroundColor: theme.colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.outline,
            },
          ]}
        >
          <Button
            mode="contained"
            onPress={onPressSubmit}
            loading={loading}
            disabled={loading}
            style={[styles.submitButton, { minHeight: 48 }]}
            contentStyle={styles.submitButtonContent}
            accessibilityLabel={
              isEdit ? t("renter.updateRenter") : t("renter.addRenter")
            }
            accessibilityRole="button"
          >
            {isEdit ? t("renter.updateRenter") : t("renter.addRenter")}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backBar: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: spacing.xs,
  },
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.lg,
  },
  submitBar: {
    paddingHorizontal: spacing.formPaddingHorizontal,
    paddingTop: spacing.md,
  },
  sectionCard: {
    marginBottom: spacing.xl,
    borderRadius: 16,
  },
  cardContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadLabel: {
    marginTop: spacing.sm,
    fontSize: 12,
  },
  sectionHeader: {
    flex: 1,
    fontWeight: "700",
  },
  inputWrap: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: 0,
  },
  errorText: {
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  helperText: {
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  submitButton: {
    borderRadius: 12,
  },
  submitButtonContent: {
    minHeight: 48,
  },
});
