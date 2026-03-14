import { LoadingOverlay, ScreenContainer } from "@/src/components";
import { useLanguageContext, usePropertyContext } from "@/src/context";
import { usePropertyForm } from "@/src/hooks/usePropertyForm";
import { BasicInfoCard } from "@/src/screens/components/BasicInfoCard";
import { LeaseInfoCard } from "@/src/screens/components/LeaseInfoCard";
import { darkColors, lightColors, spacing } from "@/src/theme";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, useTheme } from "react-native-paper";
// 1. Import the ultimate fix
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export function AddEditPropertyScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = theme.dark ? darkColors : lightColors;
  const { isRtl } = useLanguageContext();
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
  } = usePropertyForm({
    id,
    t,
    refreshProperties,
    onSuccess: () => router.back(),
  });

  const { formState, control } = formMethods;

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
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        // 2. These props are the magic combination
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === "ios" ? 20 : 0}
        bounces={false}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            { flexDirection: isRtl ? "row-reverse" : "row" },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
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
            {isEdit ? t("property.updateProperty") : t("property.addProperty")}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <BasicInfoCard
          control={control}
          t={t}
          imageUri={imageUri}
          setImageUri={setImageUri}
        />

        <LeaseInfoCard control={control} t={t} />

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
      </KeyboardAwareScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.formPaddingHorizontal,
    gap: spacing.sm,
    // Add a little bottom padding so the button doesn't hug the keyboard
    paddingBottom: 40,
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
  saveButton: {
    marginTop: 10,
    marginBottom: 24,
    borderRadius: 12,
  },
  saveButtonContent: {
    minHeight: 48,
  },
});